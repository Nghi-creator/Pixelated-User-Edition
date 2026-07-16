import assert from "node:assert/strict";
import test from "node:test";
import {
  createWasmResearchBundle,
  createWasmResearchBundleFilename,
  summarizeWasmFrames,
  wasmFrameSamplesToCsv,
  wasmLongTasksToCsv,
  type WasmCapabilitySnapshot,
} from "../../../src/features/player/research/wasmResearch.ts";

const capabilities: WasmCapabilitySnapshot = {
  crossOriginIsolated: false,
  deviceMemoryGb: 8,
  hardwareConcurrency: 10,
  jsHeapLimitBytes: null,
  language: "en",
  platform: "test",
  sharedArrayBuffer: true,
  userAgent: "test-agent",
  wasm: true,
  webgl2: true,
};

test("summarizes WASM frame pacing and dropped frames", () => {
  const summary = summarizeWasmFrames([
    { capturedAtMs: 16, deltaMs: 16 },
    { capturedAtMs: 32, deltaMs: 16 },
    { capturedAtMs: 80, deltaMs: 48 },
  ]);
  assert.equal(summary.sampleCount, 3);
  assert.equal(summary.droppedFrameCount, 1);
  assert.equal(summary.p95DeltaMs, 48);
  assert.ok(summary.approximateFps && summary.approximateFps > 30);
});

test("exports stable frame and long-task CSV columns", () => {
  assert.equal(wasmFrameSamplesToCsv([{ capturedAtMs: 16.1234, deltaMs: 15.9876 }]), "captured_at_ms,frame_delta_ms\n16.123,15.988");
  assert.equal(wasmLongTasksToCsv([{ startedAtMs: 10.125, durationMs: 75.5 }]), "started_at_ms,duration_ms\n10.125,75.5");
});

test("creates an edition-tagged research tar and safe filename", () => {
  const archive = createWasmResearchBundle({
    capabilities,
    errors: [],
    frameSamples: [],
    gameKey: "catalog:Game One",
    launch: { coreLoadMs: 20, launchToFirstFrameMs: 60, romDownloadMs: 10, romVerificationMs: 5 },
    longTasks: [],
    memory: null,
    recordedAt: new Date("2026-07-16T12:00:00Z"),
    runId: "run-1",
  });
  const archiveText = new TextDecoder().decode(archive);
  assert.match(archiveText, /summary\.json/);
  assert.match(archiveText, /"edition": "user"/);
  assert.match(archiveText, /"kind": "libretro-wasm"/);
  assert.equal(
    createWasmResearchBundleFilename("catalog:Game One", "run-1", new Date("2026-07-16T12:00:00Z")),
    "pixelated-wasm-research-catalog-Game-One-run-1-2026-07-16T12-00-00-000Z.tar",
  );
});
