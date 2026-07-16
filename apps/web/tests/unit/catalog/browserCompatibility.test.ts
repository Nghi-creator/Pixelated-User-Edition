import assert from "node:assert/strict";
import test from "node:test";
import type { ApiGame } from "../../../src/lib/api/apiTypes.ts";
import { getBrowserGameCompatibility, getPlatformLabel } from "../../../src/features/catalog/browserCompatibility.ts";

function game(overrides: Partial<NonNullable<ApiGame["game_builds"]>[number]> = {}): ApiGame {
  return {
    cover_url: "",
    id: "game",
    title: "Game",
    game_builds: [{
      artifact_filename: "game.nes",
      artifact_sha256: "a".repeat(64),
      artifact_size: 32,
      artifact_url: "artifact/game.nes",
      enabled: true,
      game_id: "game",
      id: "build",
      platform_id: "nes",
      runtime_id: "mesen",
      runtime_kind: "libretro",
      ...overrides,
    }],
  };
}

test("marks verified NES builds as browser playable", () => {
  assert.equal(getBrowserGameCompatibility(game()).kind, "browser");
});

test("marks native and unsupported libretro systems as desktop-only", () => {
  assert.equal(
    getBrowserGameCompatibility(game({ artifact_filename: null, platform_id: "linux", runtime_kind: "native_linux" })).kind,
    "desktop",
  );
  assert.equal(
    getBrowserGameCompatibility(game({ artifact_filename: "game.sfc", platform_id: "snes", runtime_id: "bsnes" })).kind,
    "desktop",
  );
});

test("marks missing verification metadata as unavailable", () => {
  assert.equal(getBrowserGameCompatibility(game({ artifact_sha256: null })).kind, "unavailable");
  assert.equal(getBrowserGameCompatibility({ cover_url: "", id: "none", title: "None" }).kind, "unavailable");
});

test("formats known and future platform labels", () => {
  assert.equal(getPlatformLabel("game_gear"), "Game Gear");
  assert.equal(getPlatformLabel("future_console"), "Future Console");
});
