import assert from "node:assert/strict";
import test from "node:test";
import {
  findWasmCoreForArtifact,
  resolveWasmCore,
  WASM_CORE_REGISTRY,
} from "../../../src/lib/runtime/wasm/coreRegistry.ts";

test("registry maps supported systems and extensions to configured cores", () => {
  assert.equal(WASM_CORE_REGISTRY.length, 3);
  assert.equal(findWasmCoreForArtifact("nes", "game.nes")?.coreId, "fceumm");
  assert.equal(findWasmCoreForArtifact("gb", "game.gb")?.coreId, "gambatte");
  assert.equal(findWasmCoreForArtifact("gbc", "game.gbc")?.coreId, "gambatte");
  assert.equal(findWasmCoreForArtifact("snes", "game.sfc"), null);
  assert.equal(findWasmCoreForArtifact("nes", "game.zip"), null);
});

test("session core resolution requires matching core, system, and artifact", () => {
  assert.equal(resolveWasmCore("fceumm", "nes", "game.nes")?.systemId, "nes");
  assert.equal(resolveWasmCore("gambatte", "gbc", "game.gbc")?.systemId, "gbc");
  assert.equal(resolveWasmCore("future-core", "nes", "game.nes"), null);
  assert.equal(resolveWasmCore("fceumm", "gba", "game.gba"), null);
});
