
import { useCallback, useEffect, useRef, useState } from "react";
import { getAll, writeChanges } from "./db";
import type { StoreName } from "./db";

interface StoredRecord<T> {
  id: string;
  value: T;
}

export function useDbRecord<T>(
  storeName: StoreName,
  recordId: string,
  initialValue: T,
  delay = 400
) {
  const [value, setValueState] = useState<T>(initialValue);
  const [loaded, setLoaded] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const valueRef = useRef(value);
  const loadedRef = useRef(false);
  const writeQueue = useRef<Promise<void>>(Promise.resolve());

  // Load the saved record before enabling automatic saving.
  useEffect(() => {
    let cancelled = false;

    async function loadRecord() {
      try {
        const records = await getAll<StoredRecord<T>>(storeName);
        const saved = records.find((record) => record.id === recordId);

        if (cancelled) return;

        const nextValue = saved ? saved.value : initialValue;

        valueRef.current = nextValue;
        setValueState(nextValue);
        loadedRef.current = true;
        setLoaded(true);
      } catch (error) {
        console.error(`[db] Failed to load "${recordId}":`, error);
        if (!cancelled) setSaveError(true);
      }
    }

    void loadRecord();

    return () => {
      cancelled = true;
    };
  }, [storeName, recordId]);

  const setValue = useCallback((nextValue: T) => {
    valueRef.current = nextValue;
    setValueState(nextValue);
  }, []);

  // Save the latest value automatically after a short pause in editing.
  useEffect(() => {
    if (!loaded) return;

    let cancelled = false;

    const timer = window.setTimeout(() => {
      writeQueue.current = writeQueue.current
        .catch(() => undefined)
        .then(async () => {
          if (cancelled) return;

          try {
            await writeChanges(
              storeName,
              [{ id: recordId, value: valueRef.current }],
              []
            );
            if (!cancelled) setSaveError(false);
          } catch (error) {
            console.error(`[db] Failed to save "${recordId}":`, error);
            if (!cancelled) setSaveError(true);
          }
        });
    }, delay);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [value, loaded, storeName, recordId, delay]);

  return { value, setValue, loaded, saveError };
}
