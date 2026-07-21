import assert from "node:assert/strict";
import test from "node:test";
import {
  getLocalGamePlayPath,
  getLocalGameTitle,
  getLocalVaultErrorMessage,
  InvalidEngineTokenError,
  normalizeLocalGameFilenames,
  toLocalVaultGames,
  validateLocalRomFile,
  detectLocalRomSystem,
  inspectLocalRomFile,
} from "../../../src/features/local-vault/localVaultState.ts";

function fileLike(name: string, size: number) {
  return { name, size } as File;
}

test("local vault ROM validation rejects missing, unsupported, and oversized files", () => {
  assert.equal(validateLocalRomFile(null), "Choose a supported ROM file first.");
  assert.equal(
    validateLocalRomFile(fileLike("demo.zip", 100)),
    "Only .nes, .gb, .gbc, .gba, .sfc, .smc, .md, .gen, .sms, and .gg files are supported.",
  );
  assert.equal(
    validateLocalRomFile(fileLike("demo.gba", 65 * 1024 * 1024)),
    "ROM files must be 64 MB or smaller.",
  );
  assert.equal(validateLocalRomFile(fileLike("demo.NES", 100)), null);
  assert.equal(validateLocalRomFile(fileLike("demo.GBC", 100)), null);
  assert.equal(validateLocalRomFile(fileLike("demo.SFC", 100)), null);
  assert.equal(validateLocalRomFile(fileLike("demo.MD", 100)), null);
  assert.equal(validateLocalRomFile(fileLike("demo.SMS", 100)), null);
  assert.equal(validateLocalRomFile(fileLike("demo.GG", 100)), null);
  assert.equal(validateLocalRomFile(fileLike("empty.nes", 0)), "The selected ROM file is empty.");
});

test("local ROM inspection detects systems and validates NES headers", async () => {
  const file = (name: string, bytes: number[]) => ({
    arrayBuffer: async () => Uint8Array.from(bytes).buffer,
    name,
    size: bytes.length,
  }) as File;

  assert.equal(detectLocalRomSystem("demo.SMC")?.id, "snes");
  assert.equal(detectLocalRomSystem("demo.zip"), null);
  assert.equal(
    (await inspectLocalRomFile(file("demo.nes", [0x4e, 0x45, 0x53, 0x1a, ...new Array(12).fill(0)]))).browserPlayable,
    true,
  );
  assert.equal(
    (await inspectLocalRomFile(file("demo.gb", [
      ...new Array(0x104).fill(0),
      0xce, 0xed, 0x66, 0x66, 0xcc, 0x0d, 0x00, 0x0b,
      0x03, 0x73, 0x00, 0x83, 0x00, 0x0c, 0x00, 0x0d,
      0x00, 0x08, 0x11, 0x1f, 0x88, 0x89, 0x00, 0x0e,
      0xdc, 0xcc, 0x6e, 0xe6, 0xdd, 0xdd, 0xd9, 0x99,
      0xbb, 0xbb, 0x67, 0x63, 0x6e, 0x0e, 0xec, 0xcc,
      0xdd, 0xdc, 0x99, 0x9f, 0xbb, 0xb9, 0x33, 0x3e,
      ...new Array(64).fill(0),
    ]))).browserPlayable,
    true,
  );
  assert.equal(
    (await inspectLocalRomFile(file("demo.gba", new Array(32).fill(0)))).browserPlayable,
    false,
  );
  await assert.rejects(
    () => inspectLocalRomFile(file("bad.nes", new Array(16).fill(0))),
    /valid NES ROM header/,
  );
});

test("local vault filenames normalize to playable local game cards", () => {
  const filenames = normalizeLocalGameFilenames([
    "new-game.nes",
    "pocket.gbc",
    "advance.gba",
    "super.sfc",
    "headered.smc",
    "drive.md",
    "mega.gen",
    "master.sms",
    "gear.gg",
    "notes.txt",
    null,
    "OLDER.NES",
  ]);

  assert.deepEqual(filenames, [
    "new-game.nes",
    "pocket.gbc",
    "advance.gba",
    "super.sfc",
    "headered.smc",
    "drive.md",
    "mega.gen",
    "master.sms",
    "gear.gg",
    "OLDER.NES",
  ]);
  assert.equal(getLocalGameTitle("new-game.nes"), "new-game");
  assert.equal(getLocalGameTitle("pocket.gbc"), "pocket");
  assert.equal(getLocalGameTitle("super.sfc"), "super");
  assert.equal(getLocalGameTitle("drive.md"), "drive");
  assert.equal(getLocalGameTitle("master.sms"), "master");
  assert.deepEqual(toLocalVaultGames(filenames), [
    { id: "new-game.nes", title: "new-game" },
    { id: "pocket.gbc", title: "pocket" },
    { id: "advance.gba", title: "advance" },
    { id: "super.sfc", title: "super" },
    { id: "headered.smc", title: "headered" },
    { id: "drive.md", title: "drive" },
    { id: "mega.gen", title: "mega" },
    { id: "master.sms", title: "master" },
    { id: "gear.gg", title: "gear" },
    { id: "OLDER.NES", title: "OLDER" },
  ]);
});

test("local vault play paths encode route-sensitive filenames", () => {
  assert.equal(
    getLocalGamePlayPath("demo #1?rev=2%.gba"),
    "/play/demo%20%231%3Frev%3D2%25.gba",
  );
});

test("local vault errors preserve invalid-token recovery guidance", () => {
  assert.equal(
    getLocalVaultErrorMessage(new InvalidEngineTokenError(), "fallback"),
    "The saved pairing token was rejected. Enter the current desktop token to reconnect.",
  );
  assert.equal(
    getLocalVaultErrorMessage(new Error("Engine offline"), "fallback"),
    "Engine offline",
  );
});
