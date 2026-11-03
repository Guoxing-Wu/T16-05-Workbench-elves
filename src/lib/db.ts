// A thin, dependency-free wrapper around IndexedDB.
// store "projects" one record per WritingProject
// store "customStructures" one record per custom StoryStructureTemplate
// Every record has a string `id`, which is used as the key.
// Only data here, UI state (active view, active project) stays in memory.

const DB_NAME = "authors-workbench";

const DB_VERSION = 2;

export const STORES = {
  projects: "projects",
  customStructures: "customStructures",
  profile: "profile",
  notebook: "notebook",
} as const;

export type StoreName = (typeof STORES)[keyof typeof STORES];

let dbPromise: Promise<IDBDatabase> | null = null;

// Opens (and on first run creates) the database. The connection is shared.
export function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available in this browser."));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    // Runs the first time, and whenever DB_VERSION goes up.
    request.onupgradeneeded = () => {
      const db = request.result;
      for (const name of Object.values(STORES)) {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { keyPath: "id" });
        }
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      // Another tab is upgrading the database: let go so it isn't blocked.
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };

    request.onerror = () => reject(request.error);
    request.onblocked = () =>
      reject(new Error("Opening the database was blocked by another tab."));
  });

  // If opening failed, allow a later call to try again.
  dbPromise.catch(() => {
    dbPromise = null;
  });

  return dbPromise;
}

// Reads every record from one store.
export async function getAll<T>(storeName: StoreName): Promise<T[]> {
  const db = await openDb();
  return new Promise<T[]>((resolve, reject) => {
    const request = db
      .transaction(storeName, "readonly")
      .objectStore(storeName)
      .getAll();
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
}

// Saves and deletes several records in ONE transaction, so either everything or nothing is written.
export async function writeChanges<T extends { id: string }>(
  storeName: StoreName,
  puts: T[],
  deleteIds: string[]
): Promise<void> {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error("Transaction aborted."));

    try {
      // insert or overwrite by id.
      for (const item of puts) store.put(item);
      for (const id of deleteIds) store.delete(id);
    } catch (error) {
      // DataCloneError when a record contains a function.
      tx.abort();
      reject(error);
    }
  });
}
