import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const manifest = JSON.parse(readFileSync("public/manifest.webmanifest", "utf8")) as {
  display: string;
  name: string;
  start_url: string;
};
const worker = readFileSync("public/sw.js", "utf8");

test("PWA manifest installs User Edition at the library", () => {
  assert.equal(manifest.name, "Pixelated User Edition");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "/home");
});

test("service worker caches only app assets and pinned first-party cores", () => {
  assert.match(worker, /url\.pathname\.startsWith\("\/assets\/"\)/);
  assert.match(worker, /url\.origin === self\.location\.origin/);
  assert.match(worker, /fceumm_libretro\.js/);
  assert.match(worker, /fceumm_libretro\.wasm/);
  assert.match(worker, /gambatte_libretro\.js/);
  assert.match(worker, /gambatte_libretro\.wasm/);
  assert.match(worker, /request\.headers\.has\("Authorization"\)/);
  assert.doesNotMatch(worker, /cdn\.jsdelivr\.net/);
  assert.doesNotMatch(worker, /supabase\.co/);
  assert.doesNotMatch(worker, /pixelated-api-services/);
});
