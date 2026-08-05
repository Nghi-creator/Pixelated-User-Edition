import { useRef, useState, type ChangeEvent } from "react";
import { findWasmCoreForArtifact } from "../../lib/runtime/wasm/coreRegistry";
import { PlayerHeader, type PlayerHeaderStatus } from "../../components/wasm/PlayerHeader";
import { PlayerStreamGrid } from "../../components/wasm/PlayerStreamGrid";
import { WasmInputSettings } from "../../components/wasm/WasmInputSettings";
import { WasmPlayerControls } from "../../components/wasm/WasmPlayerControls";
import { WasmPlayerToolDrawer } from "../../components/wasm/WasmPlayerToolDrawer";
import { WasmResearchPanel } from "../../components/wasm/WasmResearchPanel";
import { WasmSavePanel } from "../../components/wasm/WasmSavePanel";
import { WasmStage } from "../../components/wasm/WasmStage";
import { WasmTouchControls } from "../../components/wasm/WasmTouchControls";
import { useWasmResearch } from "../../hooks/wasm/useWasmResearch";
import { useLocalWasmPlayer } from "./useLocalWasmPlayer";
import { ACCEPTED_ROM_EXTENSIONS } from "./LocalRomPicker";
import type { SelectedLocalRomSystem } from "./useLocalRomSelection";

type PlayerTool = "input" | "saves";
type Props = {
  file: File;
  fileInputVersion: number;
  isInspecting: boolean;
  onClose: () => void;
  onSelectFile: (file: File) => void;
  system: SelectedLocalRomSystem;
};

const statusLabels = {
  idle: "Ready in Browser", preparing: "Preparing ROM", downloading: "Reading ROM",
  verifying: "Verifying ROM", "loading-core": "Loading WASM Core", starting: "Starting Emulator",
  playing: "WASM Runtime Active", paused: "Game Paused", stopped: "Game Stopped", error: "WASM Runtime Error",
} as const;

export function LocalWasmWorkspace({ file, fileInputVersion, isInspecting, onClose, onSelectFile, system }: Props) {
  const [activePlayerTool, setActivePlayerTool] = useState<PlayerTool | null>(null);
  const [pixelPerfect, setPixelPerfect] = useState(true);
  const [showBrowserTelemetry, setShowBrowserTelemetry] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const player = useLocalWasmPlayer(file, system.id);
  const gameKey = `local:${file.name}:${file.size}:${file.lastModified}`;
  const selectedCore = findWasmCoreForArtifact(system.id, file.name);
  const runtime = selectedCore
    ? { core: selectedCore.coreId, system: selectedCore.systemId }
    : { core: "fceumm" as const, system: "nes" as const };
  const research = useWasmResearch({ error: player.error, gameKey, progress: player.progress, runtime, status: player.status });
  const headerStatus: PlayerHeaderStatus =
    player.status === "playing" || player.status === "paused" ? "playing"
      : player.status === "error" ? "error"
        : ["preparing", "downloading", "verifying", "loading-core", "starting"].includes(player.status) ? "connecting" : "idle";
  const layoutClassName = showBrowserTelemetry ? "max-w-7xl" : "max-w-4xl";
  const chooseFile = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0];
    if (!nextFile) return;
    player.resetForFile();
    setActivePlayerTool(null);
    onSelectFile(nextFile);
  };
  const closeWorkspace = () => {
    player.resetForFile();
    setActivePlayerTool(null);
    setShowBrowserTelemetry(false);
    onClose();
  };

  return (
    <div className="flex min-h-screen flex-col items-center px-4 pb-24 pt-24">
      <PlayerHeader backRoute="/local" backText="Personal ROMs" gameTitle={file.name} hideGameChrome layoutClassName={layoutClassName} onBack={closeWorkspace} onToggleTelemetry={() => setShowBrowserTelemetry((visible) => !visible)} showTelemetry={showBrowserTelemetry} status={headerStatus} statusLabelOverride={statusLabels[player.status]} />
      <PlayerStreamGrid layoutClassName={layoutClassName} showTelemetry={showBrowserTelemetry} telemetryPanel={<WasmResearchPanel onClose={() => setShowBrowserTelemetry(false)} research={research} variant="sidebar" />}>
        <div className="w-full overflow-visible rounded-lg border border-synth-border bg-synth-surface shadow-panel">
          <WasmPlayerControls gameTitle={file.name} isMuted={player.isMuted} onFullscreen={() => void stageRef.current?.requestFullscreen?.()} onMuteChange={player.setMuted} onOpenInputSettings={() => setActivePlayerTool("input")} onOpenSaveStates={() => setActivePlayerTool("saves")} onPauseToggle={player.togglePause} onPixelPerfectChange={setPixelPerfect} onReset={player.reset} onStop={player.stop} onToggleTelemetry={() => setShowBrowserTelemetry((visible) => !visible)} onVolumeChange={player.setVolume} pixelPerfect={pixelPerfect} showTelemetry={showBrowserTelemetry} status={player.status} volume={player.volume} />
          <WasmStage canvasRef={player.canvasRef} error={player.error} idleMessage="Press Start game to run this local ROM." onStart={player.start} pixelPerfect={pixelPerfect} progress={player.progress} stageRef={stageRef} status={player.status} />
          <WasmTouchControls gameKey={gameKey} onPress={player.pressInput} onRelease={player.releaseInput} status={player.status} />
        </div>
      </PlayerStreamGrid>
      <div className={`mt-3 flex w-full ${layoutClassName} justify-end`}>
        <input accept={ACCEPTED_ROM_EXTENSIONS} className="hidden" disabled={isInspecting} key={fileInputVersion} onChange={chooseFile} ref={fileInputRef} type="file" />
        <button className="rounded-md border border-synth-border bg-synth-surface px-4 py-2 text-sm font-bold text-white hover:bg-synth-elevated disabled:opacity-50" disabled={isInspecting} onClick={() => fileInputRef.current?.click()} type="button">{isInspecting ? "Inspecting…" : "Choose another game"}</button>
      </div>
      {activePlayerTool === "input" && <WasmPlayerToolDrawer description="Customize the controls stored for this browser and connected gamepad." onClose={() => setActivePlayerTool(null)} size="wide" title="Keyboard & gamepad mapping"><WasmInputSettings disabled={!(["idle", "stopped", "error"] as string[]).includes(player.status)} gamepadMapping={player.inputBindings.gamepadMapping} gamepadName={player.inputBindings.gamepadName} keyboardMapping={player.inputBindings.keyboardMapping} onGamepadBindingChange={player.inputBindings.setGamepadBinding} onKeyboardBindingChange={player.inputBindings.setKeyboardBinding} onResetGamepad={player.inputBindings.resetGamepadMapping} onResetKeyboard={player.inputBindings.resetKeyboardMapping} variant="drawer" /></WasmPlayerToolDrawer>}
      {activePlayerTool === "saves" && <WasmPlayerToolDrawer description="Manage save states stored only in this browser." onClose={() => setActivePlayerTool(null)} title="Local save states"><WasmSavePanel captureBatterySave={player.captureBatterySave} captureState={player.captureState} gameKey={gameKey} restoreState={player.restoreState} runtime={runtime} status={player.status} variant="drawer" /></WasmPlayerToolDrawer>}
    </div>
  );
}
