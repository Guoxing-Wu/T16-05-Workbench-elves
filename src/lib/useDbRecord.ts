import { useCallback, useEffect, useRef, useState } from "react";
import { getAll, writeChanges } from "./db";
import type { StoreName } from "./db";

interface StoredRecord<T> {
  id: string;
  value: T;
}

export interface ImportedDbRecordChange {
  storeName: StoreName;
  recordId: string;
  value?: unknown;
  deleted?: boolean;
}

const DB_RECORDS_IMPORTED_EVENT = "authors-workbench:db-records-imported";
const pendingRecordWriters = new Set<() => Promise<void>>();

// Flush debounced profile/notebook edits before taking a backup snapshot.
export async function flushPendingDbRecordWrites(): Promise<void> {
  await Promise.all([...pendingRecordWriters].map((write) => write()));
}

// Notify mounted useDbRecord hooks after a backup has restored their records.
export function notifyDbRecordsImported(changes: ImportedDbRecordChange[]): void {
  if (typeof window === "undefined" || changes.length === 0) return;
  window.dispatchEvent(
    new CustomEvent<ImportedDbRecordChange[]>(DB_RECORDS_IMPORTED_EVENT, {
      detail: changes,
    })
  );
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

  const writeCurrentValue = useCallback(() => {
    writeQueue.current = writeQueue.current
      .catch(() => undefined)
      .then(() =>
        writeChanges(
          storeName,
          [{ id: recordId, value: valueRef.current }],
          []
        )
      );
    return writeQueue.current;
  }, [storeName, recordId]);

  // Load the saved record before enabling automatic saving. An import event updates
  // the hook immediately and invalidates any older read that is still in flight.
  useEffect(() => {
    let cancelled = false;
    let loadGeneration = 0;

    async function loadRecord() {
      const generation = ++loadGeneration;
      try {
        const records = await getAll<StoredRecord<T>>(storeName);
        const saved = records.find((record) => record.id === recordId);

        if (cancelled || generation !== loadGeneration) return;

        const nextValue = saved ? saved.value : initialValue;
        valueRef.current = nextValue;
        setValueState(nextValue);
        loadedRef.current = true;
        setLoaded(true);
      } catch (error) {
        if (cancelled || generation !== loadGeneration) return;
        console.error(`[db] Failed to load "${recordId}":`, error);
        setSaveError(true);
      }
    }

    function handleImportedRecords(event: Event) {
      const changes = (event as CustomEvent<ImportedDbRecordChange[]>).detail;
      const imported = changes?.find(
        (change) => change.storeName === storeName && change.recordId === recordId
      );
      if (!imported) return;

      loadGeneration += 1;
      const nextValue = imported.deleted ? initialValue : (imported.value as T);
      valueRef.current = nextValue;
      loadedRef.current = true;
      setValueState(nextValue);
      setLoaded(true);
      setSaveError(false);
    }

    window.addEventListener(DB_RECORDS_IMPORTED_EVENT, handleImportedRecords);
    void loadRecord();

    return () => {
      cancelled = true;
      loadGeneration += 1;
      window.removeEventListener(DB_RECORDS_IMPORTED_EVENT, handleImportedRecords);
    };
  }, [storeName, recordId, initialValue]);

  const setValue = useCallback((nextValue: T) => {
    valueRef.current = nextValue;
    setValueState(nextValue);
  }, []);

  // Register a flush function while this record is loaded so export includes the
  // latest in-memory value even if its debounce timer has not fired yet.
  useEffect(() => {
    if (!loaded) return;

    let active = true;
    const flush = async () => {
      if (!loadedRef.current) return;
      try {
        await writeCurrentValue();
        if (active) setSaveError(false);
      } catch (error) {
        if (active) setSaveError(true);
        throw error;
      }
    };

    pendingRecordWriters.add(flush);
    return () => {
      active = false;
      pendingRecordWriters.delete(flush);
    };
  }, [loaded, writeCurrentValue]);

  // Save the latest value automatically after a short pause in editing.
  useEffect(() => {
    if (!loaded) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      void writeCurrentValue()
        .then(() => {
          if (!cancelled) setSaveError(false);
        })
        .catch((error) => {
          console.error(`[db] Failed to save "${recordId}":`, error);
          if (!cancelled) setSaveError(true);
        });
    }, delay);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [value, loaded, recordId, delay, writeCurrentValue]);

  return { value, setValue, loaded, saveError };
}
