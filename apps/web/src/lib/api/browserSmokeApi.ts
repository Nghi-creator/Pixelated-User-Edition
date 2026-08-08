import { API_URL } from "./apiClient";
import { readBoundedResponseBlob } from "./boundedResponse";
import { browserSmokeSessionSchema } from "./apiResponseSchemas.ts";
export type { BrowserSmokeSession } from "./apiResponseSchemas.ts";

function ticketHeaders(ticket: string, json = false) {
  const headers = new Headers({ Authorization: `Smoke ${ticket}` });
  if (json) headers.set("Content-Type", "application/json");
  return headers;
}

async function errorMessage(response: Response) {
  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  return payload?.error || `Smoke API request failed with HTTP ${response.status}.`;
}

export async function getBrowserSmokeSession(ticket: string) {
  const response = await fetch(`${API_URL}/browser-smoke/session`, {
    cache: "no-store",
    headers: ticketHeaders(ticket),
  });
  if (!response.ok) throw new Error(await errorMessage(response));
  return browserSmokeSessionSchema.parse(await response.json());
}

export async function getBrowserSmokeArtifact(ticket: string, expectedSize: number) {
  const response = await fetch(`${API_URL}/browser-smoke/artifact`, {
    cache: "no-store",
    headers: ticketHeaders(ticket),
  });
  if (!response.ok) throw new Error(await errorMessage(response));
  return readBoundedResponseBlob(response, expectedSize);
}

export async function recordBrowserSmokeResult(
  ticket: string,
  result:
    | { coreId: "fceumm" | "gambatte"; status: "passed" }
    | { coreId: "fceumm" | "gambatte"; error: string; status: "failed" },
) {
  const response = await fetch(`${API_URL}/browser-smoke/result`, {
    body: JSON.stringify(result),
    headers: ticketHeaders(ticket, true),
    method: "POST",
  });
  if (!response.ok) throw new Error(await errorMessage(response));
}
