import assert from "node:assert/strict";
import test from "node:test";
import { createSessionTrackerStorage } from "../../../src/lib/sessionTrackerStorage.ts";

test("session tracker storage mirrors browser values in memory", () => {
  const values = new Map<string, string>();
  const storage = createSessionTrackerStorage({
    getItem: (key) => values.get(key) ?? null,
    removeItem: (key) => {
      values.delete(key);
    },
    setItem: (key, value) => {
      values.set(key, value);
    },
  });

  storage.setItem("session", "value");
  assert.equal(storage.getItem("session"), "value");
  storage.removeItem("session");
  assert.equal(storage.getItem("session"), null);
});

test("session tracker storage remains usable when browser storage is denied", () => {
  const deniedStorage = {
    getItem: () => {
      throw new DOMException("Storage denied", "SecurityError");
    },
    removeItem: () => {
      throw new DOMException("Storage denied", "SecurityError");
    },
    setItem: () => {
      throw new DOMException("Storage denied", "SecurityError");
    },
  };
  const storage = createSessionTrackerStorage(deniedStorage);

  storage.setItem("session", "fallback");
  assert.equal(storage.getItem("session"), "fallback");
  storage.removeItem("session");
  assert.equal(storage.getItem("session"), null);
});
