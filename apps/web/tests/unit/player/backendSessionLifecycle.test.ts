import assert from "node:assert/strict";
import test from "node:test";
import {
  claimCreatedBackendSession,
  type BackendSession,
} from "../../../src/features/player/hooks/backendSessionLifecycle.ts";

const createdSession = {
  sessionId: "backend-session",
  sessionToken: "opaque-token",
};

test("a session created for a cancelled launch is released instead of retained", () => {
  const released: BackendSession[] = [];
  const claimed = claimCreatedBackendSession(
    createdSession,
    false,
    (session) => released.push(session),
  );

  assert.equal(claimed, null);
  assert.deepEqual(released, [{ id: "backend-session", token: "opaque-token" }]);
});

test("a session created for the current launch is retained", () => {
  const released: BackendSession[] = [];
  const claimed = claimCreatedBackendSession(
    createdSession,
    true,
    (session) => released.push(session),
  );

  assert.deepEqual(claimed, { id: "backend-session", token: "opaque-token" });
  assert.deepEqual(released, []);
});
