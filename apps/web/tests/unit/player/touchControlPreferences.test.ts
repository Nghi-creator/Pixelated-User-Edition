import assert from "node:assert/strict";
import test from "node:test";
import {
  readTouchControlPreferences,
  writeTouchControlPreference,
} from "../../../src/lib/runtime/wasm/touchControlPreferences.ts";

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    values,
  };
}

test("touch controls accept only known stored presets", () => {
  const storage = memoryStorage({
    "game:preset": "unexpected",
    "game:swap": "true",
  });

  assert.deepEqual(readTouchControlPreferences("game", storage), {
    preset: "large",
    swapButtons: true,
  });
});

test("touch controls fall back when browser storage is blocked", () => {
  const blockedStorage = {
    getItem: () => {
      throw new DOMException("Blocked", "SecurityError");
    },
    setItem: () => {
      throw new DOMException("Blocked", "SecurityError");
    },
  };

  assert.deepEqual(readTouchControlPreferences("game", blockedStorage), {
    preset: "large",
    swapButtons: false,
  });
  assert.equal(
    writeTouchControlPreference("game", "preset", "compact", blockedStorage),
    false,
  );
});

test("touch controls persist preferences when storage is available", () => {
  const storage = memoryStorage();
  assert.equal(
    writeTouchControlPreference("game", "preset", "contrast", storage),
    true,
  );
  assert.equal(storage.values.get("game:preset"), "contrast");
});
