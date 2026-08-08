export function registerServiceWorker() {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    const workerUrl = new URL("/sw.js", window.location.origin);
    workerUrl.searchParams.set("v", __APP_BUILD_ID__);
    void navigator.serviceWorker.register(workerUrl, { scope: "/" });
  });
}
