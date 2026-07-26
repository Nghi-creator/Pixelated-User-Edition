type TelemetryApiDependencies = {
  apiRequest: <T>(path: string, options?: RequestInit & { authenticated?: boolean; timeoutMs?: number }) => Promise<T>;
};

export function createTelemetryApi({ apiRequest }: TelemetryApiDependencies) {
  return {
    logAccess: (path: string, sessionId: string) =>
      apiRequest<{ success: true }>("/access-logs", {
        body: JSON.stringify({ path, sessionId }),
        method: "POST",
      }),
  };
}
