import assert from "node:assert/strict";
import test from "node:test";
import { getGamePlayPath } from "../../../src/lib/appUrl.ts";

test("gameplay routes encode route-sensitive identifiers", () => {
  assert.equal(getGamePlayPath("game/with?route"), "/play/game%2Fwith%3Froute");
});
