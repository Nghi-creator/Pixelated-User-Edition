import { useEffect, useRef, useState } from "react";
import { CheckCircle2, FlaskConical, LoaderCircle, ShieldAlert, XCircle } from "lucide-react";
import {
  getBrowserSmokeArtifact,
  getBrowserSmokeSession,
  recordBrowserSmokeResult,
  type BrowserSmokeSession,
} from "../../lib/api/browserSmokeApi";
import type { GameRuntime } from "../../lib/runtime/gameRuntime";
import { resolveWasmCore } from "../../lib/runtime/wasm/coreRegistry";

const OBSERVATION_MS = 1_500;

function consumeTicketFragment() {
  const params = new URLSearchParams(window.location.hash.slice(1));
  const ticket = params.get("ticket") || "";
  window.history.replaceState(null, "", window.location.pathname);
  return ticket;
}

export default function BrowserSmoke() {
  const [ticket] = useState(consumeTicketFragment);
  const [session, setSession] = useState<BrowserSmokeSession | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "running" | "passed" | "failed">("loading");
  const [error, setError] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runtimeRef = useRef<GameRuntime | null>(null);

  useEffect(() => {
    let active = true;
    if (!ticket) {
      setError("This smoke-test link is missing its short-lived ticket.");
      setState("failed");
      return;
    }
    void getBrowserSmokeSession(ticket)
      .then((value) => {
        if (!active) return;
        setSession(value);
        setState("ready");
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(reason instanceof Error ? reason.message : "The smoke-test link is invalid.");
        setState("failed");
      });
    return () => {
      active = false;
      runtimeRef.current?.stop();
    };
  }, [ticket]);

  const run = async () => {
    if (!session || !canvasRef.current || state === "running") return;
    setState("running");
    setError("");
    let launchError = "";
    try {
      const core = resolveWasmCore(session.coreId, session.systemId, session.artifactFilename);
      if (!core) throw new Error("This candidate does not match an installed User Edition core.");
      const artifact = await getBrowserSmokeArtifact(ticket);
      const runtime = await core.loadRuntime({ canvas: canvasRef.current });
      runtimeRef.current = runtime;
      await runtime.prepare({
        expectedSha256: session.artifactSha256,
        expectedSize: session.artifactSize,
        file: artifact,
        fileName: session.artifactFilename,
      });
      await runtime.start();
      await new Promise((resolve) => window.setTimeout(resolve, OBSERVATION_MS));
      await recordBrowserSmokeResult(ticket, { coreId: "fceumm", status: "passed" });
      setState("passed");
    } catch (reason) {
      launchError = reason instanceof Error ? reason.message : "The browser smoke test failed.";
      setError(launchError);
      setState("failed");
      try {
        await recordBrowserSmokeResult(ticket, {
          coreId: "fceumm",
          error: launchError.slice(0, 1000),
          status: "failed",
        });
      } catch {
        // Keep the useful launch error when audit recording also fails.
      }
    } finally {
      runtimeRef.current?.stop();
      runtimeRef.current = null;
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-synth-bg p-6 text-white">
      <section className="w-full max-w-4xl rounded-2xl border border-synth-secondary/40 bg-synth-surface/90 p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <FlaskConical className="mt-1 h-6 w-6 text-synth-secondary" />
          <div>
            <h1 className="text-xl font-black uppercase tracking-wide">Candidate browser smoke test</h1>
            <p className="mt-1 text-sm text-slate-300">
              Isolated User Edition runner. The ticket expires automatically and cannot publish or administer catalog data.
            </p>
          </div>
        </div>

        {state === "loading" && (
          <p className="mt-8 flex items-center gap-2 text-slate-200"><LoaderCircle className="h-5 w-5 animate-spin" /> Validating test session…</p>
        )}

        {session && (
          <>
            <div className="mt-6 rounded-lg border border-synth-border bg-black/30 p-4">
              <p className="font-bold">{session.title}</p>
              <p className="mt-1 text-xs text-slate-400">{session.artifactFilename} · {session.coreId}</p>
            </div>
            <canvas ref={canvasRef} aria-label="Candidate smoke-test emulator output" className="mt-4 aspect-video w-full rounded-lg border border-synth-border bg-black" />
          </>
        )}

        {state === "ready" && (
          <button type="button" onClick={() => void run()} className="mt-5 inline-flex h-11 items-center gap-2 rounded-lg bg-synth-secondary px-5 font-extrabold text-white hover:brightness-110">
            <FlaskConical className="h-4 w-4" /> Run verified test
          </button>
        )}
        {state === "running" && <p className="mt-5 flex items-center gap-2 font-bold"><LoaderCircle className="h-5 w-5 animate-spin" /> Launching and observing…</p>}
        {state === "passed" && <p className="mt-5 flex items-center gap-2 font-bold text-emerald-300"><CheckCircle2 className="h-5 w-5" /> Passed. You can close this tab.</p>}
        {state === "failed" && (
          <p className="mt-5 flex items-start gap-2 font-bold text-red-300">
            {ticket ? <XCircle className="mt-0.5 h-5 w-5 shrink-0" /> : <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />}
            <span>{error}</span>
          </p>
        )}
      </section>
    </main>
  );
}
