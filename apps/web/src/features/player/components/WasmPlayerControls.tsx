import {
  Blend,
  Maximize2,
  Pause,
  RotateCcw,
  ScanLine,
  Settings,
  Square,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PixelIcon } from "../../../components/ui/PixelIcon";
import type { WasmPlayerStatus } from "../hooks/useWasmPlayer";

type WasmPlayerControlsProps = {
  gameTitle: string;
  isMuted: boolean;
  onFullscreen: () => void;
  onMuteChange: (muted: boolean) => void;
  onOpenInputSettings: () => void;
  onOpenSaveStates: () => void;
  onPauseToggle: () => void;
  onPixelPerfectChange: (enabled: boolean) => void;
  onReset: () => void;
  onStop: () => void;
  onToggleTelemetry?: () => void;
  onVolumeChange: (volume: number) => void;
  pixelPerfect: boolean;
  showTelemetry?: boolean;
  status: WasmPlayerStatus;
  volume: number;
};

const buttonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-synth-border bg-synth-bg px-3 text-sm font-semibold text-gray-200 transition hover:border-synth-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-40";
const iconButtonClass =
  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#5D263A] bg-[#351B27] text-white transition-colors hover:bg-[#2B1720] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-synth-secondary";

export function WasmPlayerControls({
  gameTitle,
  isMuted,
  onFullscreen,
  onMuteChange,
  onOpenInputSettings,
  onOpenSaveStates,
  onPauseToggle,
  onPixelPerfectChange,
  onReset,
  onStop,
  onToggleTelemetry,
  onVolumeChange,
  pixelPerfect,
  showTelemetry = false,
  status,
  volume,
}: WasmPlayerControlsProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const controlsRef = useRef<HTMLDivElement>(null);
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
  const pixelButtonClass = `inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-synth-secondary ${
    pixelPerfect
      ? "border-synth-action-hover bg-synth-action text-white shadow-[0_0_0_2px_rgba(255,153,193,0.35)] hover:brightness-110"
      : "border-[#5D263A] bg-[#351B27] text-gray-400 hover:bg-[#2B1720] hover:text-white"
  }`;
  const openPlayerTool = (openTool: () => void) => {
    setIsSettingsOpen(false);
    openTool();
  };

  useEffect(() => {
    if (!isSettingsOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (controlsRef.current && !controlsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsSettingsOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isSettingsOpen]);

  return (
    <div ref={controlsRef} className="relative z-30 flex min-h-14 w-full items-center gap-2 border-b border-synth-border bg-synth-surface px-3 py-2">
      <h1 className="min-w-0 flex-1 truncate text-lg font-extrabold text-white sm:text-xl">
        {gameTitle || "Loading Game..."}
      </h1>
      <div className="hidden h-10 items-center rounded-lg border border-[#5D263A] bg-[#351B27] sm:flex">
        <button aria-label={isMuted ? "Unmute game" : "Mute game"} className="inline-flex h-full w-10 items-center justify-center border-r border-[#5D263A] text-white hover:bg-[#2B1720]" onClick={() => onMuteChange(!isMuted)} type="button">
          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
        <label className="flex h-full items-center px-3">
          <span className="sr-only">Game volume</span>
          <input aria-label="Game volume" className="w-20 accent-synth-primary sm:w-24" max="1" min="0" onChange={(event) => onVolumeChange(Number(event.target.value))} step="0.05" type="range" value={volume} />
        </label>
      </div>
      {onToggleTelemetry && (
        <button
          aria-label="Toggle browser measurements"
          aria-pressed={showTelemetry}
          className={iconButtonClass}
          onClick={onToggleTelemetry}
          title="Toggle browser measurements"
          type="button"
        >
          <PixelIcon aria-hidden="true" className="h-5 w-5" name="logs" />
        </button>
      )}
      <button aria-label="Fullscreen" className={iconButtonClass} onClick={onFullscreen} title="Fullscreen" type="button">
        <Maximize2 className="h-5 w-5" />
      </button>
      <button
        aria-label={pixelPerfect ? "Disable pixel rendering" : "Enable pixel rendering"}
        aria-pressed={pixelPerfect}
        className={pixelButtonClass}
        onClick={() => onPixelPerfectChange(!pixelPerfect)}
        title={pixelPerfect ? "Pixel rendering on" : "Pixel rendering off"}
        type="button"
      >
        {pixelPerfect ? <ScanLine className="h-5 w-5" /> : <Blend className="h-5 w-5" />}
      </button>
      <div className="relative">
        <button aria-controls="wasm-player-settings-panel" aria-expanded={isSettingsOpen} aria-label="Game settings" className={iconButtonClass} onClick={() => setIsSettingsOpen((open) => !open)} title="Game settings" type="button">
          <Settings className="h-5 w-5" />
        </button>
        {isSettingsOpen && (
          <div id="wasm-player-settings-panel" className="absolute right-0 top-full mt-3 w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-synth-border bg-synth-surface/95 p-4 text-left shadow-panel backdrop-blur-md">
            <span aria-hidden="true" className="absolute -top-2 right-3 h-4 w-4 rotate-45 border-l border-t border-synth-border bg-synth-surface" />
            <p className="relative text-xs font-bold uppercase tracking-[0.16em] text-synth-secondary">Game controls</p>
            <div className="relative mt-2 grid grid-cols-3 gap-2">
              <button className={buttonClass} disabled={!isRunning} onClick={onPauseToggle} type="button">
                {status === "paused" ? <span aria-hidden>▶</span> : <Pause className="h-4 w-4" />}
                {status === "paused" ? "Resume" : "Pause"}
              </button>
              <button className={buttonClass} disabled={!isRunning} onClick={onReset} type="button"><RotateCcw className="h-4 w-4" /> Reset</button>
              <button className={buttonClass} disabled={!canStop} onClick={onStop} type="button"><Square className="h-4 w-4" /> Stop</button>
            </div>
            <p className="relative mt-4 border-t border-synth-border pt-4 text-xs font-bold uppercase tracking-[0.16em] text-synth-secondary">Player tools</p>
            <div className="relative mt-2 grid grid-cols-2 gap-2">
              <button className={buttonClass} onClick={() => openPlayerTool(onOpenInputSettings)} type="button">
                Keyboard
              </button>
              <button className={buttonClass} onClick={() => openPlayerTool(onOpenSaveStates)} type="button">
                Local states
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
