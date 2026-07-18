import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_NES_ROM_BYTES,
  normalizeExpectedRomSize,
  sha256Hex,
  validateNesRom,
} from "../../../src/lib/runtime/wasm/romValidation.ts";

function validNesRom() {
  const bytes = new Uint8Array(32);
  bytes.set([0x4e, 0x45, 0x53, 0x1a]);
  return bytes;
}

test("accepts a NES ROM with matching size and checksum", async () => {
  const bytes = validNesRom();
  await validateNesRom(bytes, {
    expectedSha256: await sha256Hex(bytes),
    expectedSize: bytes.byteLength,
  });
});

test("rejects a file without a NES header", async () => {
  await assert.rejects(() => validateNesRom(new Uint8Array(32)), /valid NES ROM header/);
});

test("rejects a ROM with the wrong size", async () => {
  await assert.rejects(
    () => validateNesRom(validNesRom(), { expectedSize: 99 }),
    /ROM size mismatch/,
  );
});

test("rejects a ROM with the wrong checksum", async () => {
  await assert.rejects(
    () => validateNesRom(validNesRom(), { expectedSha256: "0".repeat(64) }),
    /checksum verification failed/,
  );
});

test("rejects unsafe catalog size metadata before allocation", () => {
  assert.throws(() => normalizeExpectedRomSize(0), /invalid ROM byte size/);
  assert.throws(
    () => normalizeExpectedRomSize(MAX_NES_ROM_BYTES + 1),
    /invalid ROM byte size/,
  );
});
