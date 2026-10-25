import { useCallback, useEffect, useRef, useState } from "react";
import { writeChanges } from "./db";
import type { StoreName } from "./db";


export type CollectionSaveStatus =
  | "loading"
  | "saving"
  | "saved"
  | "error";


// Keeps one IndexedDB store in sync with a React array.
// Does nothing until `enabled` is true (i.e. after the initial load), so the
// empty first render can never overwrite saved data.
export function useCollectionSync<T extends { id: string }>(
  storeName: StoreName,
  items: T[],
  enabled: boolean,
  onError?: (error: unknown) => void,
  delay = 400
) {
  // What IndexedDB currently holds, keyed by id.
  const savedRef = useRef<Map<string, T>>(new Map());
  // Latest items, so a flush triggered by a timer/event never uses stale data.
  const itemsRef = useRef<T[]>(items);
  const seededRef = useRef(false);
  // Queued callbacks must check current readiness instead of an old value.
  const enabledRef = useRef(enabled);
  // Flushes run one after another, never overlapping.
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const onErrorRef = useRef(onError);

  // Completing an older write must not mark newer edits as saved.
  const [saveResult, setSaveResult] = useState<{
    status: CollectionSaveStatus;
    snapshot: T[];
  }>({
    status: "loading",
    snapshot: items,
  });


  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const flush = useCallback((): Promise<void> => {
    // Wait until initial loading has established the saved-data baseline.
    if (!enabledRef.current || !seededRef.current) {
      return Promise.resolve();
    }

    const save = async () => {
      // Readiness may change while this task waits in the queue.
      if (!enabledRef.current || !seededRef.current) return;

      const snapshot = itemsRef.current;
      const saved = savedRef.current;

      const currentIds = new Set(snapshot.map((item) => item.id));
      const puts = snapshot.filter((item) => saved.get(item.id) !== item);
      const deletes = [...saved.keys()].filter((id) => !currentIds.has(id));

      if (puts.length === 0 && deletes.length === 0) {
        setSaveResult({ status: "saved", snapshot });
        return;
      }

      setSaveResult({ status: "saving", snapshot });

      try {
        await writeChanges(storeName, puts, deletes);
        // Only remember it as saved once the write really succeeded,
        // so a failed write is retried on the next change.
        for (const item of puts) saved.set(item.id, item);
        for (const id of deletes) saved.delete(id);

        // Record which data version has been successfully saved.
        setSaveResult({ status: "saved", snapshot });

      } catch (error) {
        console.error(`[db] Failed to save "${storeName}":`, error);
        setSaveResult({ status: "error", snapshot });
        onErrorRef.current?.(error);

      }
    };

    queueRef.current = queueRef.current.then(save, save);

    return queueRef.current;
  }, [storeName]);

  // Debounced save whenever the data changes.
  useEffect(() => {
    itemsRef.current = items;
    // Keep queued saves aligned with the current persistence readiness.
    enabledRef.current = enabled;
    if (!enabled) return;

    if (!seededRef.current) {
      savedRef.current = new Map(items.map((item) => [item.id, item]));
      seededRef.current = true;

      setSaveResult({
        status: "saved",
        snapshot: items,
      });

      return;
    }

    const timer = setTimeout(() => {
      void flush();
    }, delay);
    return () => clearTimeout(timer);
  }, [items, enabled, delay, flush]);

  // Don't wait for the debounce when the user leaves.
  useEffect(() => {
    if (!enabled) return;

    const flushNow = () => {
      void flush();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushNow();
      }
    };

    window.addEventListener("pagehide", flushNow);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("pagehide", flushNow);
      document.removeEventListener(
        "visibilitychange",
        onVisibilityChange
      );
      flushNow();
    };
  }, [enabled, flush]);

  let status: CollectionSaveStatus = saveResult.status;

  if (!enabled) {
    status = "loading";
  } else if (
    status !== "loading" &&
    status !== "error" &&
    items !== saveResult.snapshot
  ) {
    status = "saving";
  }

  return {
    status,
    retry: flush,
  };
}
