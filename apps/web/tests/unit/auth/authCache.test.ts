import assert from "node:assert/strict";
import test from "node:test";
import {
  clearCacheEntryOnRejection,
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

test("rejected cache entries are cleared so a retry can make fresh work", async () => {
  let cached: Promise<string> | null = Promise.reject(new Error("temporary failure"));
  const current = cached;
  const wrapped = clearCacheEntryOnRejection(current, (rejectedPromise) => {
    if (cached === rejectedPromise) cached = null;
  });
  cached = wrapped;

  await assert.rejects(wrapped, /temporary failure/);
  assert.equal(cached, null);
});

test("a stale rejection cannot clear a newer cache entry", async () => {
  let rejectRequest: ((error: Error) => void) | undefined;
  const request = new Promise<string>((_resolve, reject) => {
    rejectRequest = reject;
  });
  let cached: Promise<string> | null;
  const wrapped = clearCacheEntryOnRejection(request, (rejectedPromise) => {
    if (cached === rejectedPromise) cached = null;
  });
  cached = wrapped;
  const replacement = Promise.resolve("fresh value");
  cached = replacement;

  rejectRequest?.(new Error("stale failure"));
  await assert.rejects(wrapped, /stale failure/);
  assert.equal(cached, replacement);
});
