import assert from "node:assert/strict";
import test from "node:test";
import {
  createWasmSaveRecord,
  MAX_IMPORTED_STATE_BYTES,
  validateImportedState,
} from "../../../src/features/player/saves/wasmSaveStore.ts";

test("creates a versioned game-specific save record", () => {
  const state = new Blob(["state"]);
  const record = createWasmSaveRecord("catalog:game-1", 2, state, undefined, new Date("2026-07-16T12:00:00Z"));
  assert.equal(record.id, "catalog:game-1:2");
  assert.equal(record.core, "fceumm");
  assert.equal(record.version, 1);
  assert.equal(record.createdAt, "2026-07-16T12:00:00.000Z");
  assert.equal(record.state, state);
});

test("accepts supported state exports and rejects unsafe imports", () => {
  assert.doesNotThrow(() => validateImportedState({ name: "slot.state", size: 128 }));
  assert.doesNotThrow(() => validateImportedState({ name: "slot.savestate", size: 128 }));
  assert.throws(() => validateImportedState({ name: "slot.zip", size: 128 }), /\.state/);
  assert.throws(() => validateImportedState({ name: "slot.state", size: 0 }), /empty/);
  assert.throws(
    () => validateImportedState({ name: "slot.state", size: MAX_IMPORTED_STATE_BYTES + 1 }),
    /16 MB/,
  );
});
