import assert from "node:assert/strict";
import test from "node:test";
import {
  findWasmCoreForArtifact,
  resolveWasmCore,
  WASM_CORE_REGISTRY,
} from "../../../src/lib/runtime/wasm/coreRegistry.ts";

test("registry maps supported systems and extensions to one configured core", () => {
  assert.equal(WASM_CORE_REGISTRY.length, 1);
  assert.equal(findWasmCoreForArtifact("nes", "game.nes")?.coreId, "fceumm");
  assert.equal(findWasmCoreForArtifact("snes", "game.sfc"), null);
  assert.equal(findWasmCoreForArtifact("nes", "game.zip"), null);
});

test("session core resolution requires matching core, system, and artifact", () => {
  assert.equal(resolveWasmCore("fceumm", "nes", "game.nes")?.systemId, "nes");
  assert.equal(resolveWasmCore("future-core", "nes", "game.nes"), null);
  assert.equal(resolveWasmCore("fceumm", "gba", "game.gba"), null);
});
