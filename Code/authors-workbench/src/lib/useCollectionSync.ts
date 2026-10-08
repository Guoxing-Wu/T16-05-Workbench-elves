import { useCallback, useEffect, useRef } from "react";
import { writeChanges } from "./db";
import type { StoreName } from "./db";

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
  // Flushes run one after another, never overlapping.
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const flush = useCallback((): Promise<void> => {
    queueRef.current = queueRef.current.then(async () => {
      const current = itemsRef.current;
      const saved = savedRef.current;

      const currentIds = new Set(current.map((item) => item.id));
      const puts = current.filter((item) => saved.get(item.id) !== item);
      const deletes = [...saved.keys()].filter((id) => !currentIds.has(id));

      if (puts.length === 0 && deletes.length === 0) return;

      try {
        await writeChanges(storeName, puts, deletes);
        // Only remember it as saved once the write really succeeded,
        // so a failed write is retried on the next change.
        for (const item of puts) saved.set(item.id, item);
        for (const id of deletes) saved.delete(id);
      } catch (error) {
        console.error(`[db] Failed to save "${storeName}":`, error);
        onErrorRef.current?.(error);
      }
    });
    return queueRef.current;
  }, [storeName]);

  // Debounced save whenever the data changes.
  useEffect(() => {
    itemsRef.current = items;
    if (!enabled) return;

    if (!seededRef.current) {
      savedRef.current = new Map(items.map((item) => [item.id, item]));
      seededRef.current = true;
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
      if (document.visibilityState === "hidden") flushNow();
    };

    window.addEventListener("pagehide", flushNow);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("pagehide", flushNow);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      flushNow();
    };
  }, [enabled, flush]);
}
