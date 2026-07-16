import { createResearchRunBundleTar } from "./researchRunBundle.ts";

export type WasmLaunchMetrics = {
  coreLoadMs: number | null;
  launchToFirstFrameMs: number | null;
  romDownloadMs: number | null;
  romVerificationMs: number | null;
};

export type WasmFrameSample = { capturedAtMs: number; deltaMs: number };
export type WasmLongTask = { durationMs: number; startedAtMs: number };
export type WasmRuntimeError = { capturedAt: string; message: string; source: string };

export type WasmCapabilitySnapshot = {
  crossOriginIsolated: boolean;
  deviceMemoryGb: number | null;
  hardwareConcurrency: number | null;
  jsHeapLimitBytes: number | null;
  language: string;
  platform: string;
  sharedArrayBuffer: boolean;
  userAgent: string;
  wasm: boolean;
  webgl2: boolean;
};

type PerformanceWithMemory = Performance & {
  memory?: { jsHeapSizeLimit: number; totalJSHeapSize: number; usedJSHeapSize: number };
};

type NavigatorWithMemory = Navigator & { deviceMemory?: number; userAgentData?: { platform?: string } };

export function captureWasmCapabilities(): WasmCapabilitySnapshot {
  const extendedNavigator = navigator as NavigatorWithMemory;
  const memory = (performance as PerformanceWithMemory).memory;
  const canvas = document.createElement("canvas");
  return {
    crossOriginIsolated: globalThis.crossOriginIsolated === true,
    deviceMemoryGb: extendedNavigator.deviceMemory ?? null,
    hardwareConcurrency: navigator.hardwareConcurrency || null,
    jsHeapLimitBytes: memory?.jsHeapSizeLimit ?? null,
    language: navigator.language,
    platform: extendedNavigator.userAgentData?.platform || navigator.platform || "unknown",
    sharedArrayBuffer: typeof SharedArrayBuffer === "function",
    userAgent: navigator.userAgent,
    wasm: typeof WebAssembly === "object",
    webgl2: Boolean(canvas.getContext("webgl2")),
  };
}

export function getWasmMemoryEstimate() {
  const memory = (performance as PerformanceWithMemory).memory;
  return memory
    ? {
        jsHeapLimitBytes: memory.jsHeapSizeLimit,
        totalJsHeapBytes: memory.totalJSHeapSize,
        usedJsHeapBytes: memory.usedJSHeapSize,
      }
    : null;
}

function percentile(values: number[], ratio: number) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * ratio) - 1)] ?? null;
}

export function summarizeWasmFrames(samples: WasmFrameSample[]) {
  const values = samples.map((sample) => sample.deltaMs).filter((value) => Number.isFinite(value) && value > 0);
  const meanDeltaMs = values.length ? values.reduce((total, value) => total + value, 0) / values.length : null;
  return {
    approximateFps: meanDeltaMs ? 1000 / meanDeltaMs : null,
    droppedFrameCount: values.filter((value) => value > 1000 / 30).length,
    meanDeltaMs,
    p95DeltaMs: percentile(values, 0.95),
    sampleCount: values.length,
  };
}

function csvNumber(value: number) {
  return Number(value.toFixed(3));
}

export function wasmFrameSamplesToCsv(samples: WasmFrameSample[]) {
  return [
    "captured_at_ms,frame_delta_ms",
    ...samples.map((sample) => `${csvNumber(sample.capturedAtMs)},${csvNumber(sample.deltaMs)}`),
  ].join("\n");
}

export function wasmLongTasksToCsv(tasks: WasmLongTask[]) {
  return [
    "started_at_ms,duration_ms",
    ...tasks.map((task) => `${csvNumber(task.startedAtMs)},${csvNumber(task.durationMs)}`),
  ].join("\n");
}

export function createWasmResearchBundle({
  capabilities,
  errors,
  frameSamples,
  gameKey,
  launch,
  longTasks,
  memory,
  recordedAt = new Date(),
  runId,
}: {
  capabilities: WasmCapabilitySnapshot;
  errors: WasmRuntimeError[];
  frameSamples: WasmFrameSample[];
  gameKey: string;
  launch: WasmLaunchMetrics;
  longTasks: WasmLongTask[];
  memory: ReturnType<typeof getWasmMemoryEstimate>;
  recordedAt?: Date;
  runId: string;
}) {
  const summary = {
    capabilities,
    edition: "user",
    errors: { count: errors.length },
    framePacing: summarizeWasmFrames(frameSamples),
    gameKey,
    generatedAt: recordedAt.toISOString(),
    launch,
    longTasks: {
      count: longTasks.length,
      totalDurationMs: longTasks.reduce((total, task) => total + task.durationMs, 0),
    },
    memory,
    runId,
    runtime: { core: "fceumm", kind: "libretro-wasm", library: "nostalgist", system: "nes" },
    schemaVersion: 1,
  };
  return createResearchRunBundleTar([
    { data: `${JSON.stringify(summary, null, 2)}\n`, name: "summary.json" },
    { data: wasmFrameSamplesToCsv(frameSamples), name: "frame-timing.csv" },
    { data: wasmLongTasksToCsv(longTasks), name: "long-tasks.csv" },
    { data: `${JSON.stringify(errors, null, 2)}\n`, name: "runtime-errors.json" },
  ], recordedAt);
}

export function createWasmResearchBundleFilename(gameKey: string, runId: string, recordedAt = new Date()) {
  const safeName = `${gameKey}-${runId}`.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
  return `pixelated-wasm-research-${safeName}-${recordedAt.toISOString().replace(/[:.]/g, "-")}.tar`;
}
