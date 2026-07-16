export type WasmBrowserSupport = {
  supported: boolean;
  reason: string | null;
};

export function getWasmBrowserSupport(): WasmBrowserSupport {
  if (typeof WebAssembly !== "object") {
    return { supported: false, reason: "This browser does not support WebAssembly." };
  }
  if (typeof fetch !== "function" || typeof ReadableStream !== "function") {
    return {
      supported: false,
      reason: "This browser is missing the streaming APIs required to load games.",
    };
  }
  if (!globalThis.crypto?.subtle) {
    return {
      supported: false,
      reason: "Secure checksum verification is unavailable. Open the site over HTTPS.",
    };
  }
  if (typeof document === "undefined") {
    return { supported: false, reason: "The WASM player requires a browser window." };
  }
  const canvas = document.createElement("canvas");
  if (!canvas.getContext("webgl2") && !canvas.getContext("webgl")) {
    return {
      supported: false,
      reason: "WebGL is disabled or unavailable. Enable hardware acceleration and retry.",
    };
  }
  return { supported: true, reason: null };
}

