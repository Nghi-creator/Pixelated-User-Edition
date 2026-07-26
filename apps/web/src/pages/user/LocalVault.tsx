import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import {
  ArrowLeft,
  Clock3,
  Gamepad2,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  PlayerHeader,
  type PlayerHeaderStatus,
} from "../../features/player/components/PlayerHeader";
import { PlayerStreamGrid } from "../../features/player/components/PlayerStreamGrid";
import { WasmInputSettings } from "../../features/player/components/WasmInputSettings";
import { WasmPlayerControls } from "../../features/player/components/WasmPlayerControls";
import { WasmPlayerToolDrawer } from "../../features/player/components/WasmPlayerToolDrawer";
import { WasmResearchPanel } from "../../features/player/components/WasmResearchPanel";
import { WasmSavePanel } from "../../features/player/components/WasmSavePanel";
import { WasmStage } from "../../features/player/components/WasmStage";
import { WasmTouchControls } from "../../features/player/components/WasmTouchControls";
import {
  inspectLocalRomFile,
  type LocalRomSystemId,
} from "../../features/local-vault/localVaultState";
import {
  clearLocalRomRecents,
  createLocalRomRecent,
  listLocalRomRecents,
  removeLocalRomRecent,
  saveLocalRomRecent,
  type LocalRomRecent,
} from "../../features/local-vault/localRomRecents";
import { useLocalWasmPlayer } from "../../features/local-vault/useLocalWasmPlayer";
import { useWasmResearch } from "../../features/player/hooks/useWasmResearch";

type SelectedSystem = { id: LocalRomSystemId; label: string };
type PlayerTool = "input" | "saves";

const PLAYER_LAYOUT_CLASS_NAME = "max-w-4xl";
const ACCEPTED_ROM_EXTENSIONS =
  ".nes,.gb,.gbc,.gba,.sfc,.smc,.md,.gen,.sms,.gg";
const statusLabels = {
  idle: "Ready in Browser",
  preparing: "Preparing ROM",
  downloading: "Reading ROM",
  verifying: "Verifying ROM",
  "loading-core": "Loading WASM Core",
  starting: "Starting Emulator",
  playing: "WASM Runtime Active",
  paused: "Game Paused",
  stopped: "Game Stopped",
  error: "WASM Runtime Error",
} as const;

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function LocalVault() {
  const [activePlayerTool, setActivePlayerTool] =
    useState<PlayerTool | null>(null);
  const [fileInputVersion, setFileInputVersion] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isInspecting, setIsInspecting] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    tone: "error" | "info";
  } | null>(null);
  const [pixelPerfect, setPixelPerfect] = useState(true);
  const [recents, setRecents] = useState<LocalRomRecent[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedSystem, setSelectedSystem] =
    useState<SelectedSystem | null>(null);
  const [showBrowserTelemetry, setShowBrowserTelemetry] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const player = useLocalWasmPlayer(selectedFile, selectedSystem?.id || null);
  const gameKey = selectedFile
    ? `local:${selectedFile.name}:${selectedFile.size}:${selectedFile.lastModified}`
    : "local:none";
  const research = useWasmResearch({
    error: player.error,
    gameKey,
    progress: player.progress,
    status: player.status,
  });

  const refreshRecents = async () => {
    try {
      setRecents(await listLocalRomRecents());
    } catch {
      setRecents([]);
    }
  };

  useEffect(() => {
    void refreshRecents();
  }, []);

  const selectFile = async (file: File) => {
    setIsInspecting(true);
    setMessage(null);
    setActivePlayerTool(null);
    player.resetForFile();
    try {
      const inspection = await inspectLocalRomFile(file);
      const system = {
        id: inspection.system.id,
        label: inspection.system.label,
      };
      setSelectedSystem(system);
      const recent = createLocalRomRecent(file, system);
      let historySaved = true;
      try {
        await saveLocalRomRecent(recent);
        await refreshRecents();
      } catch {
        historySaved = false;
      }

      if (!inspection.browserPlayable) {
        setSelectedFile(null);
        setMessage({
          tone: "info",
          text: `${system.label} ROM detected, but this release has no compatible browser core for it. The file was not uploaded or executed.${historySaved ? "" : " Recent metadata could not be saved in this browser."}`,
        });
        return;
      }

      setSelectedFile(file);
    } catch (error) {
      setSelectedFile(null);
      setSelectedSystem(null);
      setMessage({
        tone: "error",
        text:
          error instanceof Error
            ? error.message
            : "Could not inspect this ROM file.",
      });
    } finally {
      setIsInspecting(false);
      setFileInputVersion((version) => version + 1);
    }
  };

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void selectFile(file);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) void selectFile(file);
  };

  const headerStatus: PlayerHeaderStatus =
    player.status === "playing" || player.status === "paused"
      ? "playing"
      : player.status === "error"
        ? "error"
        : [
              "preparing",
              "downloading",
              "verifying",
              "loading-core",
              "starting",
            ].includes(player.status)
          ? "connecting"
          : "idle";
  const playerLayoutClassName = showBrowserTelemetry
    ? "max-w-7xl"
    : PLAYER_LAYOUT_CLASS_NAME;

  const playerDrawers = (
    <>
      {activePlayerTool === "input" && (
        <WasmPlayerToolDrawer
          description="Customize the controls stored for this browser and connected gamepad."
          onClose={() => setActivePlayerTool(null)}
          size="wide"
          title="Keyboard & gamepad mapping"
        >
          <WasmInputSettings
            disabled={!(["idle", "stopped", "error"] as string[]).includes(
              player.status,
            )}
            gamepadMapping={player.inputBindings.gamepadMapping}
            gamepadName={player.inputBindings.gamepadName}
            keyboardMapping={player.inputBindings.keyboardMapping}
            onGamepadBindingChange={player.inputBindings.setGamepadBinding}
            onKeyboardBindingChange={player.inputBindings.setKeyboardBinding}
            onResetGamepad={player.inputBindings.resetGamepadMapping}
            onResetKeyboard={player.inputBindings.resetKeyboardMapping}
            variant="drawer"
          />
        </WasmPlayerToolDrawer>
      )}

      {activePlayerTool === "saves" && (
        <WasmPlayerToolDrawer
          description="Manage save states stored only in this browser."
          onClose={() => setActivePlayerTool(null)}
          title="Local save states"
        >
          <WasmSavePanel
            captureBatterySave={player.captureBatterySave}
            captureState={player.captureState}
            gameKey={gameKey}
            restoreState={player.restoreState}
            status={player.status}
            variant="drawer"
          />
        </WasmPlayerToolDrawer>
      )}
    </>
  );

  if (selectedFile && selectedSystem) {
    return (
      <div className="flex min-h-screen flex-col items-center px-4 pb-24 pt-24">
        <PlayerHeader
          backRoute="/home"
          backText="Back to Library"
          gameTitle={selectedFile.name}
          hideGameChrome
          layoutClassName={playerLayoutClassName}
          onToggleTelemetry={() =>
            setShowBrowserTelemetry((isVisible) => !isVisible)
          }
          showStreamTelemetry={showBrowserTelemetry}
          status={headerStatus}
          statusLabelOverride={statusLabels[player.status]}
        />

        <PlayerStreamGrid
          layoutClassName={playerLayoutClassName}
          showStreamTelemetry={showBrowserTelemetry}
          telemetryPanel={
            <WasmResearchPanel
              onClose={() => setShowBrowserTelemetry(false)}
              research={research}
              variant="sidebar"
            />
          }
        >
          <div className="w-full overflow-visible rounded-lg border border-synth-border bg-synth-surface shadow-panel">
            <WasmPlayerControls
              gameTitle={selectedFile.name}
              isMuted={player.isMuted}
              onFullscreen={() =>
                void stageRef.current?.requestFullscreen?.()
              }
              onMuteChange={player.setMuted}
              onOpenInputSettings={() => setActivePlayerTool("input")}
              onOpenSaveStates={() => setActivePlayerTool("saves")}
              onPauseToggle={player.togglePause}
              onPixelPerfectChange={setPixelPerfect}
              onReset={player.reset}
              onStop={player.stop}
              onToggleTelemetry={() =>
                setShowBrowserTelemetry((isVisible) => !isVisible)
              }
              onVolumeChange={player.setVolume}
              pixelPerfect={pixelPerfect}
              showTelemetry={showBrowserTelemetry}
              status={player.status}
              volume={player.volume}
            />
            <WasmStage
              canvasRef={player.canvasRef}
              error={player.error}
              idleMessage="Press Start game to run this local ROM."
              onStart={player.start}
              pixelPerfect={pixelPerfect}
              progress={player.progress}
              stageRef={stageRef}
              status={player.status}
            />
            <WasmTouchControls
              gameKey={gameKey}
              onPress={player.pressInput}
              onRelease={player.releaseInput}
              status={player.status}
            />
          </div>
        </PlayerStreamGrid>

        <div
          className={`mt-3 flex w-full ${playerLayoutClassName} justify-end`}
        >
          <input
            ref={fileInputRef}
            accept={ACCEPTED_ROM_EXTENSIONS}
            className="hidden"
            disabled={isInspecting}
            key={fileInputVersion}
            onChange={handleFileInput}
            type="file"
          />
          <button
            className="rounded-md border border-synth-border bg-synth-surface px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-synth-elevated disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isInspecting}
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            {isInspecting ? "Inspecting…" : "Choose another game"}
          </button>
        </div>

        {playerDrawers}
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        className="group mb-6 inline-flex items-center gap-2 font-medium text-gray-400 hover:text-white"
        to="/home"
      >
        <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
        Back to Library
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white">Personal ROMs</h1>
        <p className="mt-2 max-w-3xl text-gray-400">
          Choose a ROM you are legally allowed to use. Supported NES, Game Boy,
          and Game Boy Color files run directly in this tab with WebAssembly.
        </p>
      </div>

      {message && (
        <div
          className={`mb-6 rounded-lg border p-4 text-sm font-semibold ${
            message.tone === "error"
              ? "border-red-500/40 bg-red-950/30 text-red-200"
              : "border-synth-border bg-synth-surface text-gray-200"
          }`}
          role={message.tone === "error" ? "alert" : "status"}
        >
          {message.text}
        </div>
      )}

      <div
        className={`relative mb-10 flex h-60 flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 text-center transition-colors ${
          isDragging
            ? "border-synth-primary bg-synth-elevated"
            : "border-synth-border bg-synth-bg hover:border-synth-primary"
        }`}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDrop={handleDrop}
      >
        <input
          accept={ACCEPTED_ROM_EXTENSIONS}
          className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
          disabled={isInspecting}
          key={fileInputVersion}
          onChange={handleFileInput}
          type="file"
        />
        {isInspecting ? (
          <Loader2 className="mb-4 h-12 w-12 animate-spin text-white" />
        ) : (
          <Upload className="mb-4 h-12 w-12 text-synth-secondary" />
        )}
        <h2 className="text-xl font-bold text-white">
          {isInspecting
            ? "Inspecting locally…"
            : "Drop a ROM here or choose a file"}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-gray-400">
          NES, Game Boy, and Game Boy Color launch in this browser. GBA, SNES,
          Genesis, Master System, and Game Gear are detected for future cores.
        </p>
      </div>

      <section className="rounded-lg border border-synth-border bg-synth-surface p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-white">
              <Clock3 className="h-5 w-5" /> Recent local files
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Metadata only. Select the original file again to play it.
            </p>
          </div>
          {recents.length > 0 && (
            <button
              className="text-sm font-bold text-gray-400 hover:text-red-300"
              onClick={async () => {
                await clearLocalRomRecents();
                await refreshRecents();
              }}
              type="button"
            >
              Clear history
            </button>
          )}
        </div>
        {recents.length === 0 ? (
          <div className="flex items-center gap-3 rounded-md border border-synth-border bg-synth-bg/50 p-4 text-sm text-gray-400">
            <Gamepad2 className="h-5 w-5" /> No local files opened yet.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recents.map((recent) => (
              <article
                className="flex min-w-0 items-center gap-3 rounded-md border border-synth-border bg-synth-bg/50 p-3"
                key={recent.id}
              >
                <Gamepad2 className="h-6 w-6 shrink-0 text-synth-secondary" />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-bold text-white">
                    {recent.title}
                  </h3>
                  <p className="truncate text-xs text-gray-500">
                    {recent.systemLabel} · {formatBytes(recent.size)} ·{" "}
                    {recent.fileName}
                  </p>
                </div>
                <button
                  aria-label={`Remove ${recent.title} from recent files`}
                  className="rounded p-2 text-gray-500 hover:bg-red-950/30 hover:text-red-300"
                  onClick={async () => {
                    await removeLocalRomRecent(recent.id);
                    await refreshRecents();
                  }}
                  type="button"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
