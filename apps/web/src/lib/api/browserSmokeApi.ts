import { API_URL } from "./apiClient";

export type BrowserSmokeSession = {
  artifactFilename: string;
  artifactSha256: string;
  artifactSize: number;
  candidateId: string;
  coreId: "fceumm";
  expiresAt: string;
  systemId: "nes";
  title: string;
};

function ticketHeaders(ticket: string, json = false) {
  const headers = new Headers({ Authorization: `Smoke ${ticket}` });
  if (json) headers.set("Content-Type", "application/json");
  return headers;
}

async function errorMessage(response: Response) {
  const payload = await response.json().catch(() => null) as { error?: string } | null;
  return payload?.error || `Smoke API request failed with HTTP ${response.status}.`;
}

export async function getBrowserSmokeSession(ticket: string) {
  const response = await fetch(`${API_URL}/browser-smoke/session`, {
    cache: "no-store",
    headers: ticketHeaders(ticket),
  });
  if (!response.ok) throw new Error(await errorMessage(response));
  return response.json() as Promise<BrowserSmokeSession>;
}

export async function getBrowserSmokeArtifact(ticket: string) {
  const response = await fetch(`${API_URL}/browser-smoke/artifact`, {
    cache: "no-store",
    headers: ticketHeaders(ticket),
  });
  if (!response.ok) throw new Error(await errorMessage(response));
  return response.blob();
}

export async function recordBrowserSmokeResult(
  ticket: string,
  result:
    | { coreId: "fceumm"; status: "passed" }
    | { coreId: "fceumm"; error: string; status: "failed" },
) {
  const response = await fetch(`${API_URL}/browser-smoke/result`, {
    body: JSON.stringify(result),
    headers: ticketHeaders(ticket, true),
    method: "POST",
  });
  if (!response.ok) throw new Error(await errorMessage(response));
}
