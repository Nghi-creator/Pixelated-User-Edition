import assert from "node:assert/strict";
import test from "node:test";
import { createAuthIdentityTracker } from "../../../src/lib/auth/authIdentityTracker.ts";

test("auth identity tracking ignores initialization and same-user token events", () => {
  let resetCount = 0;
  const track = createAuthIdentityTracker(() => {
    resetCount += 1;
  });

  assert.equal(track(null), false);
  assert.equal(track(null), false);
  assert.equal(track("user-a"), true);
  assert.equal(track("user-a"), false);
  assert.equal(resetCount, 1);
});

test("auth identity tracking resets state when accounts change or sign out", () => {
  let resetCount = 0;
  const track = createAuthIdentityTracker(() => {
    resetCount += 1;
  });

  track("user-a");
  assert.equal(track("user-b"), true);
  assert.equal(track(null), true);
  assert.equal(resetCount, 2);
});
