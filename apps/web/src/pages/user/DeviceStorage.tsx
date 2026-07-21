import { useEffect, useState } from "react";
import { ArrowLeft, Database, HardDrive, ShieldCheck, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { clearLocalRomRecents } from "../../features/local-vault/localRomRecents";
import {
  clearAllWasmSaveRecords,
  getSaveStorageEstimate,
} from "../../features/player/saves/wasmSaveStore";

type StorageState = {
  persisted: boolean;
  quota: number;
  usage: number;
};

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(0, Math.round(bytes / 1024))} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

async function readStorageState(): Promise<StorageState> {
  const estimate = await getSaveStorageEstimate();
  return {
    persisted: await navigator.storage?.persisted?.() || false,
    quota: estimate?.quota || 0,
    usage: estimate?.usage || 0,
  };
}

async function clearOfflineCaches() {
  if (!("caches" in window)) return;
  const names = await caches.keys();
  await Promise.all(
    names
      .filter((name) => name.startsWith("pixelated-user-"))
      .map((name) => caches.delete(name)),
  );
}

export default function DeviceStorage() {
  const [storage, setStorage] = useState<StorageState | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = async () => setStorage(await readStorageState());

  useEffect(() => {
    let active = true;
    void readStorageState().then((value) => {
      if (active) setStorage(value);
    });
    return () => {
      active = false;
    };
  }, []);

  const requestPersistence = async () => {
    setBusy(true);
    const granted = await navigator.storage?.persist?.() || false;
    setMessage(granted
      ? "This browser will protect Pixelated saves from automatic storage cleanup when possible."
      : "This browser did not grant protected storage. Export important saves regularly.");
    await refresh();
    setBusy(false);
  };

  const clearCaches = async () => {
    setBusy(true);
    await clearOfflineCaches();
    setMessage("Cached application files and emulator cores were cleared. They will download again when needed.");
    await refresh();
    setBusy(false);
  };

  const clearPersonalData = async () => {
    if (!window.confirm("Delete all browser save states and recent local-file metadata on this device?")) return;
    setBusy(true);
    await Promise.all([clearAllWasmSaveRecords(), clearLocalRomRecents()]);
    setMessage("Browser save states and local-file history were deleted from this device.");
    await refresh();
    setBusy(false);
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Link className="mb-8 inline-flex items-center gap-2 text-gray-400 hover:text-white" to="/home">
        <ArrowLeft className="h-5 w-5" /> Back to Library
      </Link>
      <h1 className="text-4xl font-extrabold text-white">Device Storage</h1>
      <p className="mt-2 text-gray-400">Manage offline application files, emulator cores, saves, and local-file history stored by this browser.</p>

      {message && <p className="mt-6 rounded-lg border border-synth-border bg-synth-surface p-4 text-sm font-semibold text-gray-200" role="status">{message}</p>}

      <section className="mt-8 rounded-lg border border-synth-border bg-synth-surface p-5">
        <h2 className="flex items-center gap-2 text-xl font-bold text-white"><HardDrive className="h-5 w-5" /> Storage usage</h2>
        <p className="mt-3 text-sm text-gray-300">
          {storage
            ? `${formatBytes(storage.usage)} used of approximately ${formatBytes(storage.quota)} available to this site.`
            : "Reading browser storage…"}
        </p>
        <div className="mt-4 flex items-start gap-3 rounded-md border border-emerald-500/30 bg-emerald-950/20 p-4 text-sm text-emerald-100">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
          <p>Personal ROM bytes are never persisted. Closing or refreshing the tab removes the selected ROM; only saves and recent-file metadata remain.</p>
        </div>
        {!storage?.persisted && (
          <button className="mt-4 rounded-md border border-synth-border bg-synth-bg px-4 py-2 text-sm font-bold text-white hover:bg-synth-elevated disabled:opacity-50" disabled={busy} onClick={() => void requestPersistence()} type="button">
            Protect saves from browser cleanup
          </button>
        )}
      </section>

      <section className="mt-6 rounded-lg border border-synth-border bg-synth-surface p-5">
        <h2 className="flex items-center gap-2 text-xl font-bold text-white"><Database className="h-5 w-5" /> Offline application cache</h2>
        <p className="mt-2 text-sm text-gray-400">Clears cached interface files and emulator cores. It does not delete saves, account data, or ROMs.</p>
        <button className="mt-4 rounded-md border border-synth-border bg-synth-bg px-4 py-2 text-sm font-bold text-white hover:bg-synth-elevated disabled:opacity-50" disabled={busy} onClick={() => void clearCaches()} type="button">
          Clear offline cache
        </button>
      </section>

      <section className="mt-6 rounded-lg border border-red-500/30 bg-red-950/10 p-5">
        <h2 className="flex items-center gap-2 text-xl font-bold text-white"><Trash2 className="h-5 w-5 text-red-300" /> Local gameplay data</h2>
        <p className="mt-2 text-sm text-gray-400">Permanently deletes every WASM save state and recent local-file entry stored in this browser.</p>
        <button className="mt-4 rounded-md border border-red-500/40 bg-red-950/30 px-4 py-2 text-sm font-bold text-red-200 hover:bg-red-950/50 disabled:opacity-50" disabled={busy} onClick={() => void clearPersonalData()} type="button">
          Delete local saves and history
        </button>
      </section>
    </div>
  );
}
