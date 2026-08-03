import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const manifest = JSON.parse(readFileSync("public/manifest.webmanifest", "utf8")) as {
  display: string;
  name: string;
  start_url: string;
};
const worker = readFileSync("public/sw.js", "utf8");
const offlinePage = readFileSync("public/offline.html", "utf8");
const offlineScript = readFileSync("public/offline.js", "utf8");

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

test("pinned cores revalidate automatically and retain an offline fallback", () => {
  assert.match(worker, /networkFirstCached\(request, CORE_CACHE, event\)/);
  assert.match(worker, /return cached \|\| response/);
  assert.match(worker, /if \(cached\) return cached/);
  assert.doesNotMatch(worker, /core changes/);
});

test("service worker refreshes the app shell only from extensionless HTML routes", () => {
  assert.match(worker, /!finalPathSegment\.includes\("\."\)/);
  assert.match(worker, /contentType\.toLowerCase\(\)\.includes\("text\/html"\)/);
  assert.match(worker, /response\.ok && isAppRoute/);
});

test("offline retry is CSP-safe and available from the shell cache", () => {
  assert.match(worker, /"\/offline\.js"/);
  assert.doesNotMatch(offlinePage, /onclick=/);
  assert.match(offlinePage, /<script src="\/offline\.js"><\/script>/);
  assert.match(offlineScript, /addEventListener\("click"/);
});
