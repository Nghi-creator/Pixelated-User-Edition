import { Download, X } from "lucide-react";
import { PixelIcon } from "../../../components/ui/PixelIcon";
import type { ReturnTypeOfUseWasmResearch } from "../research/wasmResearchTypes";

type WasmResearchPanelProps = {
  onClose?: () => void;
  research: ReturnTypeOfUseWasmResearch;
  variant?: "inline" | "sidebar";
};

function ResearchPanelContent({
  research,
  sidebar,
}: {
  research: ReturnTypeOfUseWasmResearch;
  sidebar: boolean;
}) {
  const metrics = research.getMetrics();
  const formatMs = (value: number | null) =>
    value === null ? "—" : `${Math.round(value)} ms`;

  return (
    <div className="mt-4 space-y-4">
      <label className="flex items-start gap-3 rounded-md border border-synth-border bg-synth-bg/60 p-3 text-sm text-gray-300">
        <input
          checked={research.consented}
          className="mt-1 accent-synth-primary"
          onChange={(event) => research.setConsented(event.target.checked)}
          type="checkbox"
        />
        <span>
          <strong className="block text-white">
            Opt in to local measurement recording
          </strong>
          Records launch timings, frame pacing, long tasks, runtime errors, and
          supported browser capability fields. Data remains in this tab until
          you export it.
        </span>
      </label>
      {research.consented && (
        <>
          <div
            className={`grid gap-2 text-xs ${
              sidebar ? "grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-4"
            }`}
          >
            <span className="rounded border border-synth-border bg-synth-bg p-2">
              ROM download
              <strong className="block text-white">
                {formatMs(metrics.launch.romDownloadMs)}
              </strong>
            </span>
            <span className="rounded border border-synth-border bg-synth-bg p-2">
              ROM verification
              <strong className="block text-white">
                {formatMs(metrics.launch.romVerificationMs)}
              </strong>
            </span>
            <span className="rounded border border-synth-border bg-synth-bg p-2">
              Core load
              <strong className="block text-white">
                {formatMs(metrics.launch.coreLoadMs)}
              </strong>
            </span>
            <span className="rounded border border-synth-border bg-synth-bg p-2">
              First frame
              <strong className="block text-white">
                {formatMs(metrics.launch.launchToFirstFrameMs)}
              </strong>
            </span>
            <span className="rounded border border-synth-border bg-synth-bg p-2">
              Frame samples
              <strong className="block text-white">
                {metrics.frames.sampleCount}
              </strong>
            </span>
            <span className="rounded border border-synth-border bg-synth-bg p-2">
              Approx. FPS
              <strong className="block text-white">
                {metrics.frames.approximateFps?.toFixed(1) || "—"}
              </strong>
            </span>
            <span className="rounded border border-synth-border bg-synth-bg p-2">
              Long tasks
              <strong className="block text-white">{metrics.longTasks}</strong>
            </span>
            <span className="rounded border border-synth-border bg-synth-bg p-2">
              Runtime errors
              <strong className="block text-white">{metrics.errors}</strong>
            </span>
          </div>
          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-synth-primary bg-synth-primary px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-synth-primary-hover"
            onClick={research.exportBundle}
            type="button"
          >
            <Download className="h-4 w-4" /> Export research bundle
          </button>
        </>
      )}
    </div>
  );
}

export function WasmResearchPanel({
  onClose,
  research,
  variant = "inline",
}: WasmResearchPanelProps) {
  if (variant === "sidebar") {
    return (
      <aside className="rounded-lg border border-synth-border bg-synth-surface p-4 shadow-panel">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-bold text-white">
            <PixelIcon aria-hidden="true" className="h-4 w-4" name="logs" /> Browser measurements
          </h2>
          {onClose && (
            <button
              aria-label="Hide browser measurements"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-synth-border bg-synth-bg text-gray-300 hover:text-white"
              onClick={onClose}
              title="Hide browser measurements"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <ResearchPanelContent research={research} sidebar />
      </aside>
    );
  }

  return (
    <details className="border-t border-synth-border bg-synth-surface p-4">
      <summary className="cursor-pointer text-sm font-bold text-white">
        <PixelIcon aria-hidden="true" className="mr-2 inline h-4 w-4" name="logs" />
        Browser research measurements
      </summary>
      <ResearchPanelContent research={research} sidebar={false} />
    </details>
  );
}
