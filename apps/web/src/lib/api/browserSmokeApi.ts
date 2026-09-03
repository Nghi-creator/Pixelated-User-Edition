import { API_URL } from "./apiClient";
import { readBoundedResponseBlob, readBoundedResponseJson } from "./boundedResponse";
import { createRequestAbortController } from "./requestLifecycle";
import { browserSmokeSessionSchema } from "./apiResponseSchemas.ts";
export type { BrowserSmokeSession } from "./apiResponseSchemas.ts";

const BROWSER_SMOKE_TIMEOUT_MS = 120_000;
const BROWSER_SMOKE_JSON_LIMIT_BYTES = 64 * 1024;

function ticketHeaders(ticket: string, json = false) {
  const headers = new Headers({ Authorization: `Smoke ${ticket}` });
  if (json) headers.set("Content-Type", "application/json");
  return headers;
}

async function errorMessage(response: Response) {
  const payload = await readBoundedResponseJson(response, BROWSER_SMOKE_JSON_LIMIT_BYTES).catch(
    () => null,
  );
  return payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string"
    ? payload.error
    : `Smoke API request failed with HTTP ${response.status}.`;
}

async function withBrowserSmokeRequest<T>(operation: (signal: AbortSignal) => Promise<T>) {
  const { controller, cleanup } = createRequestAbortController(BROWSER_SMOKE_TIMEOUT_MS);
  try {
    return await operation(controller.signal);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("The browser smoke API did not respond before the safety deadline.");
    }
    throw error;
  } finally {
    cleanup();
  }
}

export async function getBrowserSmokeSession(ticket: string) {
  return withBrowserSmokeRequest(async (signal) => {
    const response = await fetch(`${API_URL}/browser-smoke/session`, {
      cache: "no-store",
      headers: ticketHeaders(ticket),
      signal,
    });
    if (!response.ok) throw new Error(await errorMessage(response));
    const payload = await readBoundedResponseJson(response, BROWSER_SMOKE_JSON_LIMIT_BYTES);
    return browserSmokeSessionSchema.parse(payload);
  });
}

export async function getBrowserSmokeArtifact(ticket: string, expectedSize: number) {
  return withBrowserSmokeRequest(async (signal) => {
    const response = await fetch(`${API_URL}/browser-smoke/artifact`, {
      cache: "no-store",
      headers: ticketHeaders(ticket),
      signal,
    });
    if (!response.ok) throw new Error(await errorMessage(response));
    return readBoundedResponseBlob(response, expectedSize);
  });
}

export async function recordBrowserSmokeResult(
  ticket: string,
  result:
    | { coreId: "fceumm" | "gambatte"; status: "passed" }
    | { coreId: "fceumm" | "gambatte"; error: string; status: "failed" },
) {
  return withBrowserSmokeRequest(async (signal) => {
    const response = await fetch(`${API_URL}/browser-smoke/result`, {
      body: JSON.stringify(result),
      headers: ticketHeaders(ticket, true),
      method: "POST",
      signal,
    });
    if (!response.ok) throw new Error(await errorMessage(response));
  });
}
