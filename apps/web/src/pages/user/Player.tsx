import { lazy, Suspense, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  PlayerHeader,
  type PlayerHeaderStatus,
} from "../../features/player/components/PlayerHeader";
import { PlayerStreamGrid } from "../../features/player/components/PlayerStreamGrid";
import { WasmPlayerControls } from "../../features/player/components/WasmPlayerControls";
import { WasmPlayerToolDrawer } from "../../features/player/components/WasmPlayerToolDrawer";
import { WasmResearchPanel } from "../../features/player/components/WasmResearchPanel";
import { WasmSavePanel } from "../../features/player/components/WasmSavePanel";
import { WasmStage } from "../../features/player/components/WasmStage";
import { WasmTouchControls } from "../../features/player/components/WasmTouchControls";
import { WasmInputSettings } from "../../features/player/components/WasmInputSettings";
import { useAuthUser } from "../../features/player/hooks/useAuthUser";
import { useGameMetadata } from "../../features/player/hooks/useGameMetadata";
import { usePlayerNavigation } from "../../features/player/hooks/usePlayerNavigation";
import { usePlayCount } from "../../features/player/hooks/usePlayCount";
import { useWasmPlayer } from "../../features/player/hooks/useWasmPlayer";
import { useWasmResearch } from "../../features/player/hooks/useWasmResearch";
import { getBrowserGameCompatibility } from "../../features/catalog/browserCompatibility";

const PlayerCommunitySection = lazy(() =>
  import("../../features/player/components/PlayerCommunitySection").then(
    ({ PlayerCommunitySection }) => ({ default: PlayerCommunitySection }),
  ),
);

const statusLabels = {
  idle: "Ready in Browser",
  preparing: "Preparing Session",
  downloading: "Downloading ROM",
  verifying: "Verifying ROM",
  "loading-core": "Loading WASM Core",
  starting: "Starting Emulator",
  playing: "WASM Runtime Active",
  paused: "Game Paused",
  stopped: "Game Stopped",
  error: "WASM Runtime Error",
} as const;

const PLAYER_LAYOUT_CLASS_NAME = "max-w-4xl";
type PlayerTool = "input" | "saves";

export default function Player() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const stageRef = useRef<HTMLDivElement>(null);
  const [pixelPerfect, setPixelPerfect] = useState(true);
  const [showBrowserTelemetry, setShowBrowserTelemetry] = useState(false);
  const [activePlayerTool, setActivePlayerTool] = useState<PlayerTool | null>(null);
  const currentUser = useAuthUser();
  const { backRoute, backText } = usePlayerNavigation(location, id);
  const { authorName, game, gameRights, gameTitle, isError: metadataError, isLoading: metadataLoading } = useGameMetadata(id);
  const player = useWasmPlayer(id);
  const gameKey = `catalog:${id || "unknown"}`;
  const research = useWasmResearch({ error: player.error, gameKey, progress: player.progress, status: player.status });
  const compatibility = useMemo(() => getBrowserGameCompatibility(game), [game]);
  const canStart = !metadataLoading && !metadataError && compatibility.kind === "browser";

  usePlayCount(id, Boolean(currentUser) && player.status === "playing");

  const headerStatus = useMemo<PlayerHeaderStatus>(() => {
    if (player.status === "playing" || player.status === "paused") return "playing";
    if (player.status === "error") return "error";
    if (["preparing", "downloading", "verifying", "loading-core", "starting"].includes(player.status)) {
      return "connecting";
    }
    return "idle";
  }, [player.status]);

  const enterFullscreen = () => {
    void stageRef.current?.requestFullscreen?.();
  };
  const playerLayoutClassName = showBrowserTelemetry
    ? "max-w-7xl"
    : PLAYER_LAYOUT_CLASS_NAME;

  return (
    <div className="flex min-h-screen flex-col items-center px-4 pb-24 pt-24">
      <PlayerHeader
        backRoute={backRoute}
        backText={backText}
        gameRights={gameRights}
        gameTitle={gameTitle}
        hideGameChrome
        layoutClassName={playerLayoutClassName}
        onToggleTelemetry={() =>
          setShowBrowserTelemetry((isVisible) => !isVisible)
        }
        showStreamTelemetry={showBrowserTelemetry}
        status={headerStatus}
        statusLabelOverride={
          player.status === "idle" && !metadataLoading && compatibility.kind !== "browser"
            ? compatibility.label
            : statusLabels[player.status]
        }
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
          gameTitle={gameTitle}
          isMuted={player.isMuted}
          onFullscreen={enterFullscreen}
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
          canStart={canStart}
          canvasRef={player.canvasRef}
          error={player.error}
          idleMessage={
            metadataLoading
              ? "Checking browser compatibility…"
              : metadataError
                ? "Could not verify this game's browser build. Return to the catalog and try again."
                : compatibility.reason
          }
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

      {activePlayerTool === "input" && (
        <WasmPlayerToolDrawer
          description="Customize the controls stored for this browser and connected gamepad."
          onClose={() => setActivePlayerTool(null)}
          size="wide"
          title="Keyboard & gamepad mapping"
        >
          <WasmInputSettings
            disabled={!(["idle", "stopped", "error"] as string[]).includes(player.status)}
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

      <div
        className={`mt-3 flex w-full ${playerLayoutClassName} justify-end`}
      >
        {authorName && <p className="text-right text-sm font-medium text-synth-primary">Developed by: {authorName}</p>}
      </div>

      <Suspense
        fallback={
          <div className="mt-6 flex min-h-32 w-full max-w-5xl items-center justify-center rounded-lg border border-synth-border bg-synth-surface text-sm text-gray-300">
            Loading community…
          </div>
        }
      >
        <PlayerCommunitySection
          currentUser={currentUser}
          gameId={id}
          layoutClassName="max-w-5xl"
          onSignIn={() => navigate("/login")}
        />
      </Suspense>
    </div>
  );
}
