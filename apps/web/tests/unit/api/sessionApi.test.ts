import assert from "node:assert/strict";
import test from "node:test";
import { createSessionApi } from "../../../src/lib/api/sessionApi.ts";

test("User Edition creates WASM sessions and stops them with the opaque token", async () => {
  const requests: Array<{
    options?: RequestInit & { authenticated?: boolean; timeoutMs?: number };
    path: string;
  }> = [];
  const api = createSessionApi({
    apiRequest: async (path, options) => {
      requests.push({ options, path });
      return undefined as never;
    },
  });

  await api.createSession("game-1", "session-1");
  await api.stopSession("session-1", "opaque-session-token");

  assert.deepEqual(requests, [
    {
      options: {
        body: JSON.stringify({
          clientEdition: "user",
          clientSessionId: "session-1",
          gameId: "game-1",
          mode: "cloud",
          runtimeKind: "wasm",
        }),
        method: "POST",
      },
      path: "/sessions",
    },
    {
      options: {
        body: JSON.stringify({ sessionToken: "opaque-session-token" }),
        method: "DELETE",
      },
      path: "/sessions/session-1",
    },
  ]);
});
