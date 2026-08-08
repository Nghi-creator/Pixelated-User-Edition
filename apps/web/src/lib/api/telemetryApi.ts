import type { ApiRequest } from "./apiRequestTypes.ts";
import { successSchema } from "./apiResponseSchemas.ts";

type TelemetryApiDependencies = {
  apiRequest: ApiRequest;
};

export function createTelemetryApi({ apiRequest }: TelemetryApiDependencies) {
  return {
    logAccess: (path: string, sessionId: string) =>
      apiRequest(
        "/access-logs",
        { body: JSON.stringify({ path, sessionId }), method: "POST" },
        successSchema,
      ),
  };
}
