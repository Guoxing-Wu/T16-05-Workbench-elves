// This file provides the missing `IndexedDB` and `structuredClone` APIs in the jsdom test environment.
import "fake-indexeddb/auto";
import { deserialize, serialize } from "node:v8";

if (typeof globalThis.structuredClone === "undefined") {
  Object.defineProperty(globalThis, "structuredClone", {
    configurable: true,
    writable: true,
    value: <T,>(value: T): T => deserialize(serialize(value)) as T,
  });
}
