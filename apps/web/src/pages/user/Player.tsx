import { lazy, Suspense, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { PlayerHeader } from "../../features/player/components/PlayerHeader";
import { PlayerInstructions } from "../../features/player/components/PlayerControls";
import { WasmPlayerControls } from "../../features/player/components/WasmPlayerControls";
import { WasmStage } from "../../features/player/components/WasmStage";
import { useAuthUser } from "../../features/player/hooks/useAuthUser";
import { useGameMetadata } from "../../features/player/hooks/useGameMetadata";
import { usePlayerNavigation } from "../../features/player/hooks/usePlayerNavigation";
import { usePlayCount } from "../../features/player/hooks/usePlayCount";
import { useWasmPlayer } from "../../features/player/hooks/useWasmPlayer";
import type { WebRTCStatus } from "../../lib/webrtc/webrtcSession";

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

export default function Player() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const stageRef = useRef<HTMLDivElement>(null);
  const [pixelPerfect, setPixelPerfect] = useState(true);
  const currentUser = useAuthUser();
  const { backRoute, backText } = usePlayerNavigation(location, id);
  const { authorName, gameRights, gameTitle } = useGameMetadata(id);
  const player = useWasmPlayer(id);

  usePlayCount(id, player.status === "playing");

  const headerStatus = useMemo<WebRTCStatus>(() => {
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

  return (
    <div className="flex min-h-screen flex-col items-center px-4 pb-24 pt-24">
      <PlayerHeader
        backRoute={backRoute}
        backText={backText}
        gameRights={gameRights}
        gameTitle={gameTitle}
        hideGameChrome
        onToggleTelemetry={() => undefined}
        showStreamTelemetry={false}
        status={headerStatus}
        statusLabelOverride={statusLabels[player.status]}
      />

      <div className="w-full max-w-5xl overflow-hidden rounded-lg border border-synth-border bg-synth-surface shadow-panel" ref={stageRef}>
        <WasmStage
          canvasRef={player.canvasRef}
          error={player.error}
          onStart={player.start}
          pixelPerfect={pixelPerfect}
          progress={player.progress}
          status={player.status}
        />
        <WasmPlayerControls
          gamepadName={player.gamepadName}
          isMuted={player.isMuted}
          onFullscreen={enterFullscreen}
          onMuteChange={player.setMuted}
          onPauseToggle={player.togglePause}
          onPixelPerfectChange={setPixelPerfect}
          onReset={player.reset}
          onStop={player.stop}
          onVolumeChange={player.setVolume}
          pixelPerfect={pixelPerfect}
          status={player.status}
          volume={player.volume}
        />
      </div>

      <div className="mt-3 flex w-full max-w-5xl justify-end">
        {authorName && <p className="text-sm font-medium text-synth-primary">Developed by: {authorName}</p>}
      </div>

      <PlayerInstructions />

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
