import assert from "node:assert/strict";
import test from "node:test";
import { createLocalRomRecent, listLocalRomRecents } from "../../../src/features/local-vault/localRomRecents.ts";

test("local ROM recents contain metadata but no ROM bytes", () => {
  const recent = createLocalRomRecent(
    { lastModified: 123, name: "Tiny Quest.nes", size: 4096 },
    { id: "nes", label: "NES" },
    new Date("2026-07-16T12:00:00.000Z"),
  );

  assert.deepEqual(recent, {
    fileName: "Tiny Quest.nes",
    id: "Tiny Quest.nes:4096:123",
    lastOpenedAt: "2026-07-16T12:00:00.000Z",
    size: 4096,
    systemId: "nes",
    systemLabel: "NES",
    title: "Tiny Quest",
  });
  assert.equal("file" in recent, false);
  assert.equal("bytes" in recent, false);
});

test("local ROM recents degrade safely when IndexedDB is unavailable", async () => {
  assert.deepEqual(await listLocalRomRecents(), []);
});
