import type { ApiRequest } from "./apiRequestTypes.ts";
import { apiSessionSchema, voidSchema } from "./apiResponseSchemas.ts";
import { encodeApiPathSegment } from "./apiPath.ts";

type SessionApiDependencies = {
  apiRequest: ApiRequest;
};

export function createSessionApi({ apiRequest }: SessionApiDependencies) {
  return {
    createSession: (gameId: string, clientSessionId: string) =>
      apiRequest(
        "/sessions",
        {
          body: JSON.stringify({
            clientEdition: "user",
            clientSessionId,
            gameId,
            mode: "cloud",
            runtimeKind: "wasm",
          }),
          method: "POST",
        },
        apiSessionSchema,
      ),
    stopSession: (sessionId: string, sessionToken: string) =>
      apiRequest(
        `/sessions/${encodeApiPathSegment(sessionId)}`,
        { body: JSON.stringify({ sessionToken }), method: "DELETE" },
        voidSchema,
      ),
  };
}
