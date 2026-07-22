import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

type VercelConfig = {
  headers: Array<{
    headers: Array<{ key: string; value: string }>;
    source: string;
  }>;
};

const config = JSON.parse(readFileSync("vercel.json", "utf8")) as VercelConfig;
const headers = new Map(
  config.headers.flatMap((entry) =>
    entry.headers.map((header) => [header.key, header.value] as const),
  ),
);

test("deployment CSP permits required WASM resources without broad network access", () => {
  const csp = headers.get("Content-Security-Policy") || "";
  assert.match(csp, /script-src[^;]*'wasm-unsafe-eval'/);
  assert.match(csp, /worker-src 'self' blob: https:\/\/cdn\.jsdelivr\.net/);
  assert.match(
    csp,
    /connect-src[^;]*pixelated-api-services-6ovi\.onrender\.com/,
  );
  assert.match(csp, /connect-src[^;]*https:\/\/\*\.supabase\.co/);
  assert.doesNotMatch(csp, /connect-src[^;]*http:/);
  assert.doesNotMatch(csp, /connect-src[^;]*\shttps:\s/);
  assert.match(csp, /object-src 'none'/);
});

test("deployment headers deny embedding and unnecessary device capabilities", () => {
  assert.equal(headers.get("X-Frame-Options"), "DENY");
  assert.match(headers.get("Permissions-Policy") || "", /camera=\(\)/);
  assert.match(headers.get("Permissions-Policy") || "", /usb=\(\)/);
  assert.equal(headers.has("Cross-Origin-Embedder-Policy"), false);
  assert.equal(headers.has("Cross-Origin-Opener-Policy"), false);
});

test("emulator dependency is pinned exactly", () => {
  const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
    dependencies: Record<string, string>;
  };
  assert.equal(packageJson.dependencies.nostalgist, "0.21.0");
});
