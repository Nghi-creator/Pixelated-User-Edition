import { AlertTriangle, LoaderCircle, Play } from "lucide-react";
import type { RefObject } from "react";
import type { WasmPlayerStatus } from "../hooks/useWasmPlayer";
import type { WasmRuntimeProgress } from "../../../lib/runtime/wasm/NostalgistWasmRuntime";

type WasmStageProps = {
  canStart?: boolean;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  error: string | null;
  onStart: () => void;
  idleMessage?: string;
  pixelPerfect: boolean;
  progress: WasmRuntimeProgress | null;
  status: WasmPlayerStatus;
};

const loadingLabels: Partial<Record<WasmPlayerStatus, string>> = {
  preparing: "Preparing secure session…",
  downloading: "Downloading game…",
  verifying: "Verifying ROM…",
  "loading-core": "Loading emulator core…",
  starting: "Starting game…",
};

export function WasmStage({ canStart = true, canvasRef, error, idleMessage, onStart, pixelPerfect, progress, status }: WasmStageProps) {
  const loadingLabel = loadingLabels[status];
  const progressPercent = progress?.totalBytes
    ? Math.min(100, Math.round((progress.loadedBytes / progress.totalBytes) * 100))
    : null;
  const showLaunch = status === "idle" || status === "stopped" || status === "error";

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden bg-black">
      <canvas
        aria-label="Browser game emulator"
        className={`h-full w-full object-contain ${pixelPerfect ? "[image-rendering:pixelated]" : ""}`}
        ref={canvasRef}
      />
      {showLaunch && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80 px-6 text-center">
          {error && <AlertTriangle className="h-9 w-9 text-red-400" />}
          <p className={`max-w-xl text-sm ${error ? "text-red-200" : "text-gray-300"}`}>
            {error || idleMessage || "Run this NES game locally in your browser with WebAssembly."}
          </p>
          {canStart && (
            <button
              className="inline-flex items-center gap-2 rounded-md bg-synth-primary px-5 py-3 font-bold text-white transition hover:brightness-110"
              onClick={onStart}
              type="button"
            >
              <Play className="h-5 w-5 fill-current" />
              {status === "idle" ? "Start game" : status === "stopped" ? "Play again" : "Retry"}
            </button>
          )}
        </div>
      )}
      {loadingLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 text-gray-200" role="status">
          <LoaderCircle className="h-8 w-8 animate-spin text-synth-primary" />
          <span className="font-semibold">{loadingLabel}</span>
          {progressPercent !== null && <span className="text-sm text-gray-400">{progressPercent}%</span>}
        </div>
      )}
      {status === "paused" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40">
          <span className="rounded-md bg-black/70 px-5 py-3 font-bold uppercase tracking-wider text-white">Paused</span>
        </div>
      )}
    </div>
  );
}
