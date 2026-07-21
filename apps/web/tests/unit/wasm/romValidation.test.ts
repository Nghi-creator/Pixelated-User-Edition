import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_NES_ROM_BYTES,
  normalizeExpectedRomSize,
  sha256Hex,
  validateBrowserRom,
  validateNesRom,
} from "../../../src/lib/runtime/wasm/romValidation.ts";

function validNesRom() {
  const bytes = new Uint8Array(32);
  bytes.set([0x4e, 0x45, 0x53, 0x1a]);
  return bytes;
}

function validGameBoyRom() {
  const bytes = new Uint8Array(0x150);
  bytes.set([
    0xce, 0xed, 0x66, 0x66, 0xcc, 0x0d, 0x00, 0x0b,
    0x03, 0x73, 0x00, 0x83, 0x00, 0x0c, 0x00, 0x0d,
    0x00, 0x08, 0x11, 0x1f, 0x88, 0x89, 0x00, 0x0e,
    0xdc, 0xcc, 0x6e, 0xe6, 0xdd, 0xdd, 0xd9, 0x99,
    0xbb, 0xbb, 0x67, 0x63, 0x6e, 0x0e, 0xec, 0xcc,
    0xdd, 0xdc, 0x99, 0x9f, 0xbb, 0xb9, 0x33, 0x3e,
  ], 0x104);
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

test("accepts a Game Boy ROM with its validated header", async () => {
  const bytes = validGameBoyRom();
  await validateBrowserRom("gb", bytes, {
    expectedSha256: await sha256Hex(bytes),
    expectedSize: bytes.byteLength,
  });
});

test("rejects a Game Boy ROM without its Nintendo header", async () => {
  await assert.rejects(
    () => validateBrowserRom("gbc", new Uint8Array(0x150)),
    /valid Game Boy ROM header/,
  );
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
