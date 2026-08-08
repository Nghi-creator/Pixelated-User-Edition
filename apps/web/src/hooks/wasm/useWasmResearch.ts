import { useCallback, useEffect, useRef, useState } from "react";
import type { WasmRuntimeProgress } from "../../lib/runtime/wasm/NostalgistWasmRuntime";
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
} from "../../lib/runtime/wasm/wasmResearch";
import type { WasmPlayerStatus } from "../../lib/runtime/wasm/runtimeTypes";
import type { WasmCoreId, WasmSystemId } from "../../lib/runtime/wasm/coreRegistry";

const emptyLaunchMetrics = (): WasmLaunchMetrics => ({
  coreLoadMs: null,
  launchToFirstFrameMs: null,
  romDownloadMs: null,
  romVerificationMs: null,
});

const MAX_FRAME_SAMPLES = 18_000;
const MAX_LONG_TASKS = 2_000;
const LIVE_METRIC_FRAME_SAMPLES = 600;

function orderedFrameSamples(samples: WasmFrameSample[], cursor: number) {
  if (samples.length < MAX_FRAME_SAMPLES || cursor === 0) return samples;
  return [...samples.slice(cursor), ...samples.slice(0, cursor)];
}

function recentFrameSamples(samples: WasmFrameSample[], cursor: number) {
  const sampleCount = Math.min(samples.length, LIVE_METRIC_FRAME_SAMPLES);
  if (samples.length < MAX_FRAME_SAMPLES) {
    return samples.slice(-sampleCount);
  }

  const recent: WasmFrameSample[] = [];
  const start = (cursor - sampleCount + MAX_FRAME_SAMPLES) % MAX_FRAME_SAMPLES;
  for (let offset = 0; offset < sampleCount; offset += 1) {
    const sample = samples[(start + offset) % MAX_FRAME_SAMPLES];
    if (sample) recent.push(sample);
  }
  return recent;
}

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
  runtime,
  status,
}: {
  error: string | null;
  gameKey: string;
  progress: WasmRuntimeProgress | null;
  runtime: { core: WasmCoreId; system: WasmSystemId };
  status: WasmPlayerStatus;
}) {
  const [capabilities, setCapabilities] = useState<WasmCapabilitySnapshot | null>(null);
  const [consented, setConsentedState] = useState(false);
  const consentedRef = useRef(false);
  const errorsRef = useRef<WasmRuntimeError[]>([]);
  const framesRef = useRef<WasmFrameSample[]>([]);
  const frameCursorRef = useRef(0);
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
      frameCursorRef.current = 0;
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
    frameCursorRef.current = 0;
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
    if (
      !consentedRef.current ||
      status !== "playing" ||
      launchRef.current.launchToFirstFrameMs !== null
    )
      return;
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
      const nextSample = { capturedAtMs: now, deltaMs: now - previous };
      if (framesRef.current.length < MAX_FRAME_SAMPLES) {
        framesRef.current.push(nextSample);
      } else {
        framesRef.current[frameCursorRef.current] = nextSample;
        frameCursorRef.current = (frameCursorRef.current + 1) % MAX_FRAME_SAMPLES;
      }
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
      if (longTasksRef.current.length > MAX_LONG_TASKS) {
        longTasksRef.current.splice(0, longTasksRef.current.length - MAX_LONG_TASKS);
      }
    });
    observer.observe({ entryTypes: ["longtask"] });
    return () => observer.disconnect();
  }, [consented]);

  useEffect(() => {
    if (!consented || !error) return;
    errorsRef.current.push({
      capturedAt: new Date().toISOString(),
      message: error,
      source: "player",
    });
  }, [consented, error]);

  useEffect(() => {
    if (!consented) return;
    const onError = (event: ErrorEvent) =>
      errorsRef.current.push({
        capturedAt: new Date().toISOString(),
        message: event.message,
        source: "window.error",
      });
    const onRejection = (event: PromiseRejectionEvent) =>
      errorsRef.current.push({
        capturedAt: new Date().toISOString(),
        message: errorMessage(event.reason),
        source: "unhandledrejection",
      });
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
      frameSamples: orderedFrameSamples(framesRef.current, frameCursorRef.current),
      gameKey,
      launch: launchRef.current,
      longTasks: longTasksRef.current,
      memory: getWasmMemoryEstimate(),
      recordedAt,
      runId: runIdRef.current,
      runtime,
    });
    downloadBlob(
      new Blob([bytes], { type: "application/x-tar" }),
      createWasmResearchBundleFilename(gameKey, runIdRef.current, recordedAt),
    );
  }, [capabilities, gameKey, runtime]);

  return {
    consented,
    exportBundle,
    getMetrics: () => ({
      errors: errorsRef.current.length,
      frames: summarizeWasmFrames(recentFrameSamples(framesRef.current, frameCursorRef.current)),
      launch: launchRef.current,
      longTasks: longTasksRef.current.length,
    }),
    setConsented,
  };
}

export type WasmResearch = ReturnType<typeof useWasmResearch>;
