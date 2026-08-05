import assert from "node:assert/strict";
import test from "node:test";
import {
  getFavoriteSnapshot,
  mutateFavorite,
  replaceFavoriteIds,
  resetFavoriteState,
} from "../../../src/lib/favorites/favoriteState.ts";

test("favorite state serializes duplicate mutations", async () => {
  resetFavoriteState();
  replaceFavoriteIds(new Set(["game-1"]));

  let mutations = 0;
  await Promise.all([
    mutateFavorite("game-2", true, async () => {
      mutations += 1;
    }),
    mutateFavorite("game-2", true, async () => {
      mutations += 1;
    }),
  ]);

  assert.equal(mutations, 1);
  assert.deepEqual([...getFavoriteSnapshot().ids], ["game-1", "game-2"]);
});

test("favorite state can be replaced by an authoritative library response", () => {
  resetFavoriteState();
  replaceFavoriteIds(new Set(["game-3"]));

  assert.deepEqual([...getFavoriteSnapshot().ids], ["game-3"]);
});

test("failed favorite mutations preserve prior state and release their lock", async () => {
  resetFavoriteState();
  replaceFavoriteIds(new Set(["game-1"]));

  await assert.rejects(
    mutateFavorite("game-1", false, async () => {
      throw new Error("storage unavailable");
    }),
    /storage unavailable/,
  );

  assert.deepEqual([...getFavoriteSnapshot().ids], ["game-1"]);
  assert.equal(getFavoriteSnapshot().pendingIds.has("game-1"), false);
});
