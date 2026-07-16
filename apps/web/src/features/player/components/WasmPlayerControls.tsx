import {
  Gamepad2,
  Maximize2,
  Pause,
  RotateCcw,
  Square,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { WasmPlayerStatus } from "../hooks/useWasmPlayer";

type WasmPlayerControlsProps = {
  gamepadName: string | null;
  isMuted: boolean;
  onFullscreen: () => void;
  onMuteChange: (muted: boolean) => void;
  onPauseToggle: () => void;
  onPixelPerfectChange: (enabled: boolean) => void;
  onReset: () => void;
  onStop: () => void;
  onVolumeChange: (volume: number) => void;
  pixelPerfect: boolean;
  status: WasmPlayerStatus;
  volume: number;
};

const buttonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md border border-synth-border bg-synth-elevated px-3 text-sm font-semibold text-gray-200 transition hover:border-synth-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-40";

export function WasmPlayerControls({
  gamepadName,
  isMuted,
  onFullscreen,
  onMuteChange,
  onPauseToggle,
  onPixelPerfectChange,
  onReset,
  onStop,
  onVolumeChange,
  pixelPerfect,
  status,
  volume,
}: WasmPlayerControlsProps) {
  const isRunning = status === "playing" || status === "paused";
  const canStop = [
    "preparing",
    "downloading",
    "verifying",
    "loading-core",
    "starting",
    "playing",
    "paused",
  ].includes(status);

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-synth-border bg-synth-surface p-3">
      <button className={buttonClass} disabled={!isRunning} onClick={onPauseToggle} type="button">
        {status === "paused" ? <span aria-hidden>▶</span> : <Pause className="h-4 w-4" />}
        {status === "paused" ? "Resume" : "Pause"}
      </button>
      <button className={buttonClass} disabled={!isRunning} onClick={onReset} type="button">
        <RotateCcw className="h-4 w-4" /> Reset
      </button>
      <button className={buttonClass} disabled={!canStop} onClick={onStop} type="button">
        <Square className="h-4 w-4" /> Stop
      </button>
      <button className={buttonClass} onClick={onFullscreen} type="button">
        <Maximize2 className="h-4 w-4" /> Fullscreen
      </button>
      <button
        aria-pressed={pixelPerfect}
        className={buttonClass}
        onClick={() => onPixelPerfectChange(!pixelPerfect)}
        type="button"
      >
        Pixel {pixelPerfect ? "on" : "off"}
      </button>
      <button
        aria-label={isMuted ? "Unmute game" : "Mute game"}
        className={buttonClass}
        onClick={() => onMuteChange(!isMuted)}
        type="button"
      >
        {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </button>
      <label className="flex items-center gap-2 text-sm text-gray-300">
        <span className="sr-only">Game volume</span>
        <input
          aria-label="Game volume"
          className="w-24 accent-synth-primary"
          max="1"
          min="0"
          onChange={(event) => onVolumeChange(Number(event.target.value))}
          step="0.05"
          type="range"
          value={volume}
        />
      </label>
      <span className="ml-auto inline-flex min-w-0 items-center gap-2 text-xs text-gray-400">
        <Gamepad2 className="h-4 w-4 shrink-0" />
        <span className="max-w-48 truncate">{gamepadName || "Keyboard ready"}</span>
      </span>
    </div>
  );
}
