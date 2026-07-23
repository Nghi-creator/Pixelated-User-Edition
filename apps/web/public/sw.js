// Bump this value whenever the app shell or pinned emulator core changes.
const CACHE_VERSION = "2026-07-23-2";
const CACHE_PREFIX = "pixelated-user-";
const SHELL_CACHE = `${CACHE_PREFIX}shell-${CACHE_VERSION}`;
const ASSET_CACHE = `${CACHE_PREFIX}assets-${CACHE_VERSION}`;
const CORE_CACHE = `${CACHE_PREFIX}cores-${CACHE_VERSION}`;
const SHELL_URLS = [
  "/",
  "/offline.html",
  "/manifest.webmanifest",
  "/pixelated-icon.svg",
  "/pixelated-icon-192.png",
  "/pixelated-icon-512.png",
];

function isApprovedCoreAsset(url) {
  return url.origin === self.location.origin && [
    "/emulator-cores/fceumm_libretro.js",
    "/emulator-cores/fceumm_libretro.wasm",
    "/emulator-cores/gambatte_libretro.js",
    "/emulator-cores/gambatte_libretro.wasm",
  ].includes(url.pathname);
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key.startsWith(CACHE_PREFIX) && ![SHELL_CACHE, ASSET_CACHE, CORE_CACHE].includes(key))
        .map((key) => caches.delete(key)),
    )),
  );
  self.clients.claim();
});

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok || response.type === "opaque") {
    const cache = await caches.open(cacheName);
    await cache.put(request, response.clone());
  }
  return response;
}

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(SHELL_CACHE);
      await cache.put("/", response.clone());
    }
    return response;
  } catch {
    return (await caches.match("/")) || caches.match("/offline.html");
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || request.headers.has("Authorization")) return;

  const url = new URL(request.url);
  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (url.origin === self.location.origin && url.pathname.startsWith("/assets/")) {
    event.respondWith(cacheFirst(request, ASSET_CACHE));
    return;
  }

  if (isApprovedCoreAsset(url)) {
    event.respondWith(cacheFirst(request, CORE_CACHE));
  }
});
