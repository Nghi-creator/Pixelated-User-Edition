import assert from "node:assert/strict";
import test from "node:test";
import {
  clearAuthScopedCache,
  setAuthScopedSession,
} from "../../../src/lib/auth/authCache.ts";

test("auth state changes clear every user-scoped cache", () => {
  const state = {
    favorites: new Set(["game-1"]),
    permissions: { canPublish: true },
    session: Promise.resolve({ userId: "user-1" }),
  };

  clearAuthScopedCache(state);

  assert.deepEqual(state, {
    favorites: null,
    permissions: null,
    session: null,
  });
});

test("same-user token refreshes replace the cached API session", async () => {
  const state = {
    session: Promise.resolve({ access_token: "expired-token" }),
  };

  setAuthScopedSession(state, { access_token: "refreshed-token" });

  assert.deepEqual(await state.session, { access_token: "refreshed-token" });
});
