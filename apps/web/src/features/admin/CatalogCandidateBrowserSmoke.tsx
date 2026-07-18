import { useEffect, useRef, useState } from "react";
import { CheckCircle2, FlaskConical, Loader2, XCircle } from "lucide-react";
import type { GameRuntime } from "../../lib/runtime/gameRuntime";
import { api } from "../../lib/api/apiClient";
import type { ApiCatalogCandidate } from "../../lib/api/apiTypes";
import { resolveWasmCore } from "../../lib/runtime/wasm/coreRegistry";
import { getAdminApiErrorMessage } from "./adminState";

type Props = {
  candidate: ApiCatalogCandidate;
  onRecorded: (candidate: ApiCatalogCandidate) => void;
};

const SMOKE_OBSERVATION_MS = 1_500;

function waitForObservation() {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, SMOKE_OBSERVATION_MS);
  });
}

export function CatalogCandidateBrowserSmoke({ candidate, onRecorded }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runtimeRef = useRef<GameRuntime | null>(null);
  const [running, setRunning] = useState(false);
  const [localError, setLocalError] = useState("");

  useEffect(() => () => runtimeRef.current?.stop(), []);

  const compatibility = candidate.browser_compatibility;
  const canRun =
    compatibility.eligible &&
    compatibility.coreId === "fceumm" &&
    compatibility.systemId === "nes";

  const runSmoke = async () => {
    if (!canRun || !canvasRef.current || running) return;
    setRunning(true);
    setLocalError("");
    let runtime: GameRuntime | null = null;

    try {
      const definition = resolveWasmCore(
        compatibility.coreId,
        compatibility.systemId,
        candidate.artifact_filename,
      );
      if (!definition) throw new Error("No matching User Edition WASM core is registered.");

      const artifact = await api.catalogCandidateSmokeArtifact(candidate.id);
      runtime = await definition.loadRuntime({ canvas: canvasRef.current });
      runtimeRef.current = runtime;
      await runtime.prepare({
        expectedSha256: candidate.artifact_sha256,
        expectedSize: candidate.artifact_size,
        file: artifact,
        fileName: candidate.artifact_filename || "candidate.nes",
      });
      await runtime.start();
      await waitForObservation();
      runtime.stop();
      runtimeRef.current = null;

      const result = await api.recordCatalogCandidateBrowserSmoke<ApiCatalogCandidate>(
        candidate.id,
        { coreId: "fceumm", status: "passed" },
      );
      onRecorded(result.candidate);
    } catch (error) {
      runtime?.stop();
      runtimeRef.current = null;
      const message = getAdminApiErrorMessage(error, "Browser smoke test failed.");
      setLocalError(message);
      try {
        const result = await api.recordCatalogCandidateBrowserSmoke<ApiCatalogCandidate>(
          candidate.id,
          { coreId: "fceumm", error: message.slice(0, 1000), status: "failed" },
        );
        onRecorded(result.candidate);
      } catch {
        // Keep the original launch error visible when evidence could not be saved.
      }
    } finally {
      setRunning(false);
    }
  };

  const status = candidate.browser_smoke_status;
  const resultMessage = localError || candidate.browser_smoke_error;

  return (
    <section className="mt-4 rounded-lg border border-synth-secondary/40 bg-synth-bg/80 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-extrabold uppercase text-white">
            <FlaskConical className="h-4 w-4" /> Browser-play smoke test
          </h3>
          <p className="mt-1 text-sm font-medium text-gray-200">
            {canRun
              ? "Runs the verified candidate in the same FCEUmm WASM core used by User Edition."
              : compatibility.reason || "This candidate is not browser-compatible."}
          </p>
        </div>
        <button
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-synth-secondary/60 bg-synth-secondary/15 px-4 text-sm font-bold text-white hover:bg-synth-secondary/25 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!canRun || running}
          onClick={() => void runSmoke()}
          type="button"
        >
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
          {running ? "Testing…" : status === "not_tested" ? "Run test" : "Run again"}
        </button>
      </div>

      {canRun && (
        <canvas
          aria-label="Candidate browser smoke-test output"
          className={`mt-3 aspect-video w-full rounded border border-synth-border bg-black ${running ? "block" : "hidden"}`}
          ref={canvasRef}
        />
      )}

      {status === "passed" && !localError && (
        <p className="mt-3 flex items-center gap-2 text-sm font-bold text-emerald-200">
          <CheckCircle2 className="h-4 w-4" /> Passed with {candidate.browser_smoke_core_id}
        </p>
      )}
      {(status === "failed" || localError) && (
        <p className="mt-3 flex items-start gap-2 text-sm font-bold text-red-200">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{resultMessage || "The browser smoke test failed."}</span>
        </p>
      )}
    </section>
  );
}
