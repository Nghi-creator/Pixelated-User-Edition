import { useEffect, useState, type PointerEvent } from "react";
import type { WasmPlayerStatus } from "../hooks/useWasmPlayer";

type Preset = "compact" | "large" | "contrast";
type Props = {
  gameKey: string;
  onPress: (button: string) => void;
  onRelease: (button: string) => void;
  status: WasmPlayerStatus;
};

const presets: Record<Preset, string> = {
  compact: "Compact",
  large: "Large targets",
  contrast: "High contrast",
};

export function WasmTouchControls({ gameKey, onPress, onRelease, status }: Props) {
  const preferenceKey = `pixelated:touch-controls:${gameKey}`;
  const [preset, setPreset] = useState<Preset>(() => (localStorage.getItem(`${preferenceKey}:preset`) as Preset) || "large");
  const [swapButtons, setSwapButtons] = useState(() => localStorage.getItem(`${preferenceKey}:swap`) === "true");
  const enabled = status === "playing" || status === "paused";

  useEffect(() => localStorage.setItem(`${preferenceKey}:preset`, preset), [preferenceKey, preset]);
  useEffect(() => localStorage.setItem(`${preferenceKey}:swap`, String(swapButtons)), [preferenceKey, swapButtons]);

  const size = preset === "compact" ? "h-11 min-w-11" : "h-14 min-w-14";
  const tone = preset === "contrast" ? "border-yellow-300 bg-black text-yellow-200" : "border-synth-border bg-synth-elevated text-white";
  const bind = (button: string) => ({
    onPointerCancel: () => onRelease(button),
    onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      onPress(button);
    },
    onPointerUp: (event: PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      onRelease(button);
    },
  });
  const controlClass = `${size} select-none rounded-full border text-sm font-black touch-none disabled:opacity-30 ${tone}`;

  return (
    <details className="border-t border-synth-border bg-synth-surface p-3 md:hidden">
      <summary className="cursor-pointer text-sm font-bold text-white">Touch controls & accessibility</summary>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-300">
        <label>Preset <select className="ml-1 rounded border border-synth-border bg-synth-bg p-1.5" onChange={(event) => setPreset(event.target.value as Preset)} value={preset}>{Object.entries(presets).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="flex items-center gap-1.5"><input checked={swapButtons} onChange={(event) => setSwapButtons(event.target.checked)} type="checkbox" /> Swap A/B layout for this game</label>
      </div>
      <div className="mt-4 flex items-center justify-between gap-4">
        <div className="grid grid-cols-3 gap-1" aria-label="Directional pad">
          <span /><button aria-label="Up" className={controlClass} disabled={!enabled} {...bind("up")}>▲</button><span />
          <button aria-label="Left" className={controlClass} disabled={!enabled} {...bind("left")}>◀</button><span /><button aria-label="Right" className={controlClass} disabled={!enabled} {...bind("right")}>▶</button>
          <span /><button aria-label="Down" className={controlClass} disabled={!enabled} {...bind("down")}>▼</button><span />
        </div>
        <div className="flex items-end gap-2">
          <button className={controlClass} disabled={!enabled} {...bind("select")}>Select</button>
          <button className={controlClass} disabled={!enabled} {...bind("start")}>Start</button>
          <button className={controlClass} disabled={!enabled} {...bind(swapButtons ? "a" : "b")}>{swapButtons ? "A" : "B"}</button>
          <button className={controlClass} disabled={!enabled} {...bind(swapButtons ? "b" : "a")}>{swapButtons ? "B" : "A"}</button>
        </div>
      </div>
    </details>
  );
}
