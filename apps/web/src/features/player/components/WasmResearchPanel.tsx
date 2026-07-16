import { Download, FlaskConical } from "lucide-react";
import type { ReturnTypeOfUseWasmResearch } from "../research/wasmResearchTypes";

export function WasmResearchPanel({ research }: { research: ReturnTypeOfUseWasmResearch }) {
  const metrics = research.getMetrics();
  const formatMs = (value: number | null) => value === null ? "—" : `${Math.round(value)} ms`;

  return (
    <details className="border-t border-synth-border bg-synth-surface p-4">
      <summary className="cursor-pointer text-sm font-bold text-white"><FlaskConical className="mr-2 inline h-4 w-4" />Browser research measurements</summary>
      <div className="mt-4 space-y-4">
        <label className="flex items-start gap-3 rounded-md border border-synth-border bg-synth-bg/60 p-3 text-sm text-gray-300">
          <input checked={research.consented} className="mt-1 accent-synth-primary" onChange={(event) => research.setConsented(event.target.checked)} type="checkbox" />
          <span><strong className="block text-white">Opt in to local measurement recording</strong>Records launch timings, animation-frame pacing, long tasks, runtime errors, browser/OS capability fields, and supported memory estimates. Data stays in this tab until you export it. Enable this before starting a game to capture every launch phase.</span>
        </label>
        {research.consented && (
          <>
            <div className="grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
              <span className="rounded border border-synth-border bg-synth-bg p-2">ROM download <strong className="block text-white">{formatMs(metrics.launch.romDownloadMs)}</strong></span>
              <span className="rounded border border-synth-border bg-synth-bg p-2">ROM verification <strong className="block text-white">{formatMs(metrics.launch.romVerificationMs)}</strong></span>
              <span className="rounded border border-synth-border bg-synth-bg p-2">Core load <strong className="block text-white">{formatMs(metrics.launch.coreLoadMs)}</strong></span>
              <span className="rounded border border-synth-border bg-synth-bg p-2">Launch to first browser frame <strong className="block text-white">{formatMs(metrics.launch.launchToFirstFrameMs)}</strong></span>
              <span className="rounded border border-synth-border bg-synth-bg p-2">Frame samples <strong className="block text-white">{metrics.frames.sampleCount}</strong></span>
              <span className="rounded border border-synth-border bg-synth-bg p-2">Approx. FPS <strong className="block text-white">{metrics.frames.approximateFps?.toFixed(1) || "—"}</strong></span>
              <span className="rounded border border-synth-border bg-synth-bg p-2">Long tasks <strong className="block text-white">{metrics.longTasks}</strong></span>
              <span className="rounded border border-synth-border bg-synth-bg p-2">Runtime errors <strong className="block text-white">{metrics.errors}</strong></span>
            </div>
            <button className="inline-flex items-center gap-2 rounded-md border border-synth-border bg-synth-elevated px-3 py-2 text-sm font-bold text-white hover:border-synth-primary" onClick={research.exportBundle} type="button"><Download className="h-4 w-4" /> Export WASM research bundle</button>
          </>
        )}
      </div>
    </details>
  );
}
