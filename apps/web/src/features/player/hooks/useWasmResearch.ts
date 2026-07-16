import { useCallback, useEffect, useRef, useState } from "react";
import type { WasmRuntimeProgress } from "../../../lib/runtime/wasm/NostalgistWasmRuntime";
import {
  captureWasmCapabilities,
  createWasmResearchBundle,
  createWasmResearchBundleFilename,
  getWasmMemoryEstimate,
  summarizeWasmFrames,
  type WasmCapabilitySnapshot,
  type WasmFrameSample,
  type WasmLaunchMetrics,
  type WasmLongTask,
  type WasmRuntimeError,
} from "../research/wasmResearch";
import type { WasmPlayerStatus } from "./useWasmPlayer";

const emptyLaunchMetrics = (): WasmLaunchMetrics => ({
  coreLoadMs: null,
  launchToFirstFrameMs: null,
  romDownloadMs: null,
  romVerificationMs: null,
});

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function errorMessage(value: unknown) {
  if (value instanceof Error) return value.message;
  if (typeof value === "string") return value;
  return "Unknown browser runtime error";
}

export function useWasmResearch({
  error,
  gameKey,
  progress,
  status,
}: {
  error: string | null;
  gameKey: string;
  progress: WasmRuntimeProgress | null;
  status: WasmPlayerStatus;
}) {
  const [capabilities, setCapabilities] = useState<WasmCapabilitySnapshot | null>(null);
  const [consented, setConsentedState] = useState(false);
  const [, setRefreshVersion] = useState(0);
  const consentedRef = useRef(false);
  const errorsRef = useRef<WasmRuntimeError[]>([]);
  const framesRef = useRef<WasmFrameSample[]>([]);
  const launchRef = useRef<WasmLaunchMetrics>(emptyLaunchMetrics());
  const launchStartedAtRef = useRef<number | null>(null);
  const longTasksRef = useRef<WasmLongTask[]>([]);
  const phaseRef = useRef<WasmRuntimeProgress["phase"] | null>(null);
  const phaseStartedAtRef = useRef<number | null>(null);
  const runIdRef = useRef("");

  const setConsented = useCallback((enabled: boolean) => {
    consentedRef.current = enabled;
    setConsentedState(enabled);
    if (enabled) {
      if (!runIdRef.current) {
        runIdRef.current = `wasm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
      }
      setCapabilities(captureWasmCapabilities());
    } else {
      setCapabilities(null);
      errorsRef.current = [];
      framesRef.current = [];
      longTasksRef.current = [];
    }
  }, []);

  useEffect(() => {
    if (!consentedRef.current || status !== "preparing") return;
    launchRef.current = emptyLaunchMetrics();
    launchStartedAtRef.current = performance.now();
    phaseRef.current = null;
    phaseStartedAtRef.current = null;
    framesRef.current = [];
    longTasksRef.current = [];
    errorsRef.current = [];
    runIdRef.current = `wasm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  }, [status]);

  useEffect(() => {
    if (!consentedRef.current || !progress || progress.phase === phaseRef.current) return;
    const now = performance.now();
    const previousPhase = phaseRef.current;
    const previousStartedAt = phaseStartedAtRef.current;
    if (previousStartedAt !== null) {
      const duration = Math.max(0, now - previousStartedAt);
      if (previousPhase === "downloading") launchRef.current.romDownloadMs = duration;
      if (previousPhase === "verifying") launchRef.current.romVerificationMs = duration;
      if (previousPhase === "loading-core") launchRef.current.coreLoadMs = duration;
    }
    phaseRef.current = progress.phase;
    phaseStartedAtRef.current = now;
  }, [progress]);

  useEffect(() => {
    if (!consentedRef.current || status !== "playing" || launchRef.current.launchToFirstFrameMs !== null) return;
    const frameId = requestAnimationFrame((now) => {
      if (launchStartedAtRef.current !== null) {
        launchRef.current.launchToFirstFrameMs = Math.max(0, now - launchStartedAtRef.current);
      }
    });
    return () => cancelAnimationFrame(frameId);
  }, [status]);

  useEffect(() => {
    if (!consentedRef.current || status !== "playing") return;
    let previous = performance.now();
    let frameId = 0;
    const sample = (now: number) => {
      framesRef.current.push({ capturedAtMs: now, deltaMs: now - previous });
      if (framesRef.current.length > 18_000) framesRef.current.shift();
      previous = now;
      frameId = requestAnimationFrame(sample);
    };
    frameId = requestAnimationFrame(sample);
    return () => cancelAnimationFrame(frameId);
  }, [status]);

  useEffect(() => {
    if (!consented || !PerformanceObserver.supportedEntryTypes?.includes("longtask")) return;
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        longTasksRef.current.push({ durationMs: entry.duration, startedAtMs: entry.startTime });
      });
    });
    observer.observe({ entryTypes: ["longtask"] });
    return () => observer.disconnect();
  }, [consented]);

  useEffect(() => {
    if (!consented || status !== "playing") return;
    const timer = window.setInterval(() => setRefreshVersion((version) => version + 1), 1000);
    return () => window.clearInterval(timer);
  }, [consented, status]);

  useEffect(() => {
    if (!consented || !error) return;
    errorsRef.current.push({ capturedAt: new Date().toISOString(), message: error, source: "player" });
  }, [consented, error]);

  useEffect(() => {
    if (!consented) return;
    const onError = (event: ErrorEvent) => errorsRef.current.push({ capturedAt: new Date().toISOString(), message: event.message, source: "window.error" });
    const onRejection = (event: PromiseRejectionEvent) => errorsRef.current.push({ capturedAt: new Date().toISOString(), message: errorMessage(event.reason), source: "unhandledrejection" });
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, [consented]);

  const exportBundle = useCallback(() => {
    if (!capabilities) throw new Error("Enable research recording before exporting.");
    const recordedAt = new Date();
    const bytes = createWasmResearchBundle({
      capabilities,
      errors: errorsRef.current,
      frameSamples: framesRef.current,
      gameKey,
      launch: launchRef.current,
      longTasks: longTasksRef.current,
      memory: getWasmMemoryEstimate(),
      recordedAt,
      runId: runIdRef.current,
    });
    downloadBlob(new Blob([bytes], { type: "application/x-tar" }), createWasmResearchBundleFilename(gameKey, runIdRef.current, recordedAt));
  }, [capabilities, gameKey]);

  return {
    consented,
    exportBundle,
    getMetrics: () => ({
      errors: errorsRef.current.length,
      frames: summarizeWasmFrames(framesRef.current),
      launch: launchRef.current,
      longTasks: longTasksRef.current.length,
    }),
    setConsented,
  };
}
