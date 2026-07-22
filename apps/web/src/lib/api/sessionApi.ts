import type { ApiSessionResponse } from "./apiTypes";

type SessionApiDependencies = {
  apiRequest: <T>(path: string, options?: RequestInit & { authenticated?: boolean; timeoutMs?: number }) => Promise<T>;
};

export function createSessionApi({ apiRequest }: SessionApiDependencies) {
  return {
    createSession: (gameId: string, clientSessionId: string) =>
      apiRequest<ApiSessionResponse>("/sessions", {
        body: JSON.stringify({
          clientEdition: "user",
          clientSessionId,
          gameId,
          mode: "cloud",
          runtimeKind: "wasm",
        }),
        method: "POST",
      }),
    stopSession: (sessionId: string, sessionToken: string) =>
      apiRequest<void>(`/sessions/${sessionId}`, {
        body: JSON.stringify({ sessionToken }),
        method: "DELETE",
      }),
  };
}
