import assert from "node:assert/strict";
import test from "node:test";
import {
  apiPaginatedGamesSchema,
  apiSessionSchema,
  browserSmokeSessionSchema,
} from "../../../src/lib/api/apiResponseSchemas.ts";

test("catalog responses reject unsafe pagination metadata", () => {
  const baseResponse = { featuredGames: [], games: [], page: 1, pageSize: 15, total: 0 };

  assert.throws(
    () => apiPaginatedGamesSchema.parse({ ...baseResponse, totalPages: Number.POSITIVE_INFINITY }),
    /Invalid input/,
  );
  assert.throws(
    () => apiPaginatedGamesSchema.parse({ ...baseResponse, totalPages: 1.5 }),
    /Invalid input/,
  );
  assert.equal(apiPaginatedGamesSchema.parse({ ...baseResponse, totalPages: 1 }).totalPages, 1);
});

test("session responses require bounded artifact metadata and known runtime values", () => {
  const response = {
    boot: {
      artifactSha256: null,
      artifactSize: null,
      browser: {
        artifactUrlExpiresAt: null,
        coreId: null,
        eligible: false,
        reason: "Unavailable",
        systemId: null,
      },
      launchManifestId: null,
      romFilename: null,
      romUrl: null,
      runtimeId: "runtime",
      runtimeKind: "native_linux",
    },
    engineUrl: "",
    expiresAt: "2026-08-08T00:00:00.000Z",
    sessionId: "session",
    sessionToken: "token",
    user: { id: null },
  };

  assert.equal(apiSessionSchema.parse(response).sessionId, "session");
  assert.throws(
    () => apiSessionSchema.parse({ ...response, boot: { ...response.boot, artifactSize: -1 } }),
    /Too small/,
  );
});

test("browser smoke responses require a SHA-256 digest", () => {
  assert.throws(
    () =>
      browserSmokeSessionSchema.parse({
        artifactFilename: "game.nes",
        artifactSha256: "not-a-digest",
        artifactSize: 1024,
        candidateId: "candidate",
        coreId: "fceumm",
        expiresAt: "2026-08-08T00:00:00.000Z",
        systemId: "nes",
        title: "Game",
      }),
    /Invalid string/,
  );
});
