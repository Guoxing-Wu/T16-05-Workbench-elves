// IndexedDB is not available in jsdom, so these tests run against fake-indexeddb
import "../test/indexedDbSetup";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { IDBFactory } from "fake-indexeddb";

type DbModule = typeof import("./db");
let db: DbModule;

// A brand new database and a fresh copy of db.ts (it caches its connection) for every test.
beforeEach(async () => {
  jest.resetModules();
  (globalThis as { indexedDB: IDBFactory }).indexedDB = new IDBFactory();
  db = await import("./db");
});

const rec = (id: string, extra: Record<string, unknown> = {}) => ({ id, ...extra });

describe("openDb", () => {
  it("creates the database with both stores on first run", async () => {
    const conn = await db.openDb();
    expect(conn.name).toBe("authors-workbench");
    expect(conn.version).toBe(1);
    expect([...conn.objectStoreNames].sort()).toEqual(["customStructures", "projects"]);
  });

  it("uses `id` as the key of every store", async () => {
    const conn = await db.openDb();
    const tx = conn.transaction(["projects", "customStructures"], "readonly");
    expect(tx.objectStore("projects").keyPath).toBe("id");
    expect(tx.objectStore("customStructures").keyPath).toBe("id");
  });

  it("shares one connection between callers", async () => {
    const [a, b] = await Promise.all([db.openDb(), db.openDb()]);
    expect(a).toBe(b);
  });

  it("exposes the store names", () => {
    expect(db.STORES).toEqual({ projects: "projects", customStructures: "customStructures" });
  });

  it("rejects with a clear message when IndexedDB does not exist, then recovers", async () => {
    const factory = globalThis.indexedDB;
    Object.defineProperty(globalThis, "indexedDB", { value: undefined, configurable: true, writable: true });
    await expect(db.openDb()).rejects.toThrow("IndexedDB is not available in this browser.");

    // A failed open must not be cached: a later call can succeed.
    Object.defineProperty(globalThis, "indexedDB", { value: factory, configurable: true, writable: true });
    await expect(db.openDb()).resolves.toBeDefined();
  });

  it("lets another tab upgrade the database instead of blocking it", async () => {
    await db.openDb();
    const upgraded = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("authors-workbench", 2);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error("upgrade was blocked"));
    });
    expect(upgraded.version).toBe(2);
    upgraded.close();
  });
});

describe("getAll", () => {
  it("returns an empty list for an empty store", async () => {
    expect(await db.getAll("projects")).toEqual([]);
    expect(await db.getAll("customStructures")).toEqual([]);
  });

  it("returns every record, ordered by id", async () => {
    await db.writeChanges("projects", [rec("b"), rec("c"), rec("a")], []);
    expect((await db.getAll<{ id: string }>("projects")).map((r) => r.id)).toEqual(["a", "b", "c"]);
  });
});

describe("writeChanges", () => {
  it("saves new records", async () => {
    await db.writeChanges("projects", [rec("p1", { title: "One" }), rec("p2", { title: "Two" })], []);
    expect(await db.getAll("projects")).toEqual([
      { id: "p1", title: "One" },
      { id: "p2", title: "Two" },
    ]);
  });

  it("overwrites a record with the same id", async () => {
    await db.writeChanges("projects", [rec("p1", { title: "Old" })], []);
    await db.writeChanges("projects", [rec("p1", { title: "New" })], []);
    expect(await db.getAll("projects")).toEqual([{ id: "p1", title: "New" }]);
  });

  it("deletes records by id and leaves the others", async () => {
    await db.writeChanges("projects", [rec("a"), rec("b"), rec("c")], []);
    await db.writeChanges("projects", [], ["b"]);
    expect((await db.getAll<{ id: string }>("projects")).map((r) => r.id)).toEqual(["a", "c"]);
  });

  it("does not fail when deleting an id that does not exist", async () => {
    await expect(db.writeChanges("projects", [], ["ghost"])).resolves.toBeUndefined();
  });

  it("does nothing when there is nothing to write", async () => {
    await expect(db.writeChanges("projects", [], [])).resolves.toBeUndefined();
    expect(await db.getAll("projects")).toEqual([]);
  });

  it("applies puts and deletes together in one call", async () => {
    await db.writeChanges("projects", [rec("old")], []);
    await db.writeChanges("projects", [rec("new")], ["old"]);
    expect(await db.getAll("projects")).toEqual([{ id: "new" }]);
  });

  it("keeps the two stores independent", async () => {
    await db.writeChanges("projects", [rec("same-id", { kind: "project" })], []);
    await db.writeChanges("customStructures", [rec("same-id", { kind: "structure" })], []);
    expect(await db.getAll("projects")).toEqual([{ id: "same-id", kind: "project" }]);
    expect(await db.getAll("customStructures")).toEqual([{ id: "same-id", kind: "structure" }]);
  });

  it("stores nested data exactly as given (a whole project)", async () => {
    const project = {
      id: "p1",
      chapters: [{ id: "c1", title: "Born", notes: "line1\nline2" }],
      events: [{ id: "e1", startDate: { year: 2020, month: 1 } }],
    };
    await db.writeChanges("projects", [project], []);
    expect(await db.getAll("projects")).toEqual([project]);
  });

  it("handles many records", async () => {
    const many = Array.from({ length: 500 }, (_, i) => rec(`id-${String(i).padStart(3, "0")}`));
    await db.writeChanges("projects", many, []);
    expect(await db.getAll("projects")).toHaveLength(500);
  });

  it("is atomic: if one record cannot be stored, nothing is written", async () => {
    await db.writeChanges("projects", [rec("keep", { title: "before" })], []);

    // A function cannot be cloned into IndexedDB (DataCloneError).
    const bad = { id: "bad", callback: () => 1 };
    await expect(
      db.writeChanges("projects", [rec("keep", { title: "after" }), bad], ["keep"])
    ).rejects.toBeDefined();

    expect(await db.getAll("projects")).toEqual([{ id: "keep", title: "before" }]);
  });

  it("rejects a record that has no id", async () => {
    await expect(db.writeChanges("projects", [{} as { id: string }], [])).rejects.toBeDefined();
    expect(await db.getAll("projects")).toEqual([]);
  });

  it("keeps working after a failed write", async () => {
    await expect(db.writeChanges("projects", [{ id: "bad", f: () => 1 }], [])).rejects.toBeDefined();
    await db.writeChanges("projects", [rec("good")], []);
    expect(await db.getAll("projects")).toEqual([{ id: "good" }]);
  });

  it("persists across a reconnect (data survives closing the connection)", async () => {
    await db.writeChanges("projects", [rec("p1", { title: "Saved" })], []);
    (await db.openDb()).close();

    jest.resetModules();
    const fresh = await import("./db"); // same fake IndexedDB, new connection
    expect(await fresh.getAll("projects")).toEqual([{ id: "p1", title: "Saved" }]);
  });
});
