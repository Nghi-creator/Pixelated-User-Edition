import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Download, HardDrive, Save, Trash2, Upload } from "lucide-react";
import type { WasmPlayerStatus } from "../hooks/useWasmPlayer";
import {
  createWasmSaveRecord,
  deleteWasmSaveRecord,
  getSaveStorageEstimate,
  listWasmSaveRecords,
  putWasmSaveRecord,
  validateImportedState,
  type WasmSaveRecord,
  type WasmSaveSlot,
} from "../saves/wasmSaveStore";

type Props = {
  captureBatterySave: () => Promise<Blob>;
  captureState: () => Promise<{ state: Blob; thumbnail?: Blob }>;
  gameKey: string;
  restoreState: (state: Blob) => Promise<void>;
  status: WasmPlayerStatus;
  variant?: "inline" | "drawer";
};

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function SaveThumbnail({ blob }: { blob: Blob }) {
  const url = useMemo(() => URL.createObjectURL(blob), [blob]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return <img alt="Save-state preview" className="h-10 w-14 rounded object-cover" src={url} />;
}

export function WasmSavePanel({ captureBatterySave, captureState, gameKey, restoreState, status, variant = "inline" }: Props) {
  const importSlot = useRef<WasmSaveSlot>(1);
  const [busySlot, setBusySlot] = useState<WasmSaveSlot | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [records, setRecords] = useState<WasmSaveRecord[]>([]);
  const [storage, setStorage] = useState<{ quota: number; usage: number } | null>(null);
  const isRunning = status === "playing" || status === "paused";

  const refresh = useCallback(async () => {
    setRecords(await listWasmSaveRecords(gameKey));
    setStorage(await getSaveStorageEstimate());
  }, [gameKey]);

  useEffect(() => {
    void refresh().catch(() => setMessage("Browser save storage is unavailable."));
  }, [refresh]);

  const run = async (slot: WasmSaveSlot, action: () => Promise<void>) => {
    setBusySlot(slot);
    setMessage(null);
    try {
      await action();
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The save operation failed.");
    } finally {
      setBusySlot(null);
    }
  };

  const importState = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const slot = importSlot.current;
    void run(slot, async () => {
      validateImportedState(file);
      await putWasmSaveRecord(createWasmSaveRecord(gameKey, slot, file));
      setMessage(`Imported into slot ${slot}. Start the same game before loading it.`);
    });
  };

  return (
    <section className={variant === "inline" ? "border-t border-synth-border bg-synth-bg/60 p-4" : ""} aria-label="Browser save states">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        {variant === "inline" && (
          <div>
            <h2 className="flex items-center gap-2 font-bold text-white"><Save className="h-4 w-4" /> Local save states</h2>
            <p className="mt-1 text-xs text-gray-400">Stored only in this browser. A state must be loaded with the same game and emulator core.</p>
          </div>
        )}
        {storage && (
          <span className={`flex items-center gap-1 text-xs text-gray-500 ${variant === "drawer" ? "ml-auto" : ""}`} title="Overall browser storage usage">
            <HardDrive className="h-3.5 w-3.5" /> {formatBytes(storage.usage)} of {formatBytes(storage.quota)} used
          </span>
        )}
      </div>

      <input accept=".state,.savestate" className="sr-only" id={`state-import-${gameKey.replace(/[^a-z0-9]/gi, "-")}`} onChange={importState} type="file" />
      <div className={`grid gap-2 ${variant === "inline" ? "md:grid-cols-3" : "grid-cols-1"}`}>
        {([1, 2, 3] as WasmSaveSlot[]).map((slot) => {
          const record = records.find((candidate) => candidate.slot === slot);
          const importingId = `state-import-${gameKey.replace(/[^a-z0-9]/gi, "-")}`;
          return (
            <article className="rounded-md border border-synth-border bg-synth-bg p-3" key={slot}>
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white">Slot {slot}</h3>
                  <p className="text-xs text-gray-500">{record ? new Date(record.createdAt).toLocaleString() : "Empty"}</p>
                </div>
                {record?.thumbnail && <SaveThumbnail blob={record.thumbnail} />}
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button className="rounded border border-synth-border px-2 py-1 text-xs font-bold text-white disabled:opacity-40" disabled={!isRunning || busySlot !== null} onClick={() => void run(slot, async () => { const saved = await captureState(); await putWasmSaveRecord(createWasmSaveRecord(gameKey, slot, saved.state, saved.thumbnail)); setMessage(`Saved slot ${slot}.`); })} type="button">Save</button>
                <button className="rounded border border-synth-border px-2 py-1 text-xs font-bold text-white disabled:opacity-40" disabled={!record || !isRunning || busySlot !== null} onClick={() => record && void run(slot, async () => { await restoreState(record.state); setMessage(`Loaded slot ${slot}.`); })} type="button">Load</button>
                <label className="cursor-pointer rounded border border-synth-border px-2 py-1 text-xs font-bold text-gray-300" htmlFor={importingId} onClick={() => { importSlot.current = slot; }}><Upload className="mr-1 inline h-3 w-3" />Import</label>
                <button aria-label={`Export slot ${slot}`} className="rounded border border-synth-border p-1 text-gray-300 disabled:opacity-40" disabled={!record} onClick={() => record && downloadBlob(record.state, `pixelated-slot-${slot}.state`)} type="button"><Download className="h-3.5 w-3.5" /></button>
                <button aria-label={`Delete slot ${slot}`} className="rounded border border-synth-border p-1 text-gray-400 disabled:opacity-40" disabled={!record || busySlot !== null} onClick={() => void run(slot, async () => { await deleteWasmSaveRecord(gameKey, slot); setMessage(`Deleted slot ${slot}.`); })} type="button"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </article>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-gray-500">If storage is cleared or full, export important states and remove old site data in browser settings.</p>
        <button className="rounded border border-synth-border px-3 py-1.5 text-xs font-bold text-gray-300 disabled:opacity-40" disabled={!isRunning} onClick={() => void captureBatterySave().then((blob) => downloadBlob(blob, "pixelated-battery.srm")).catch((error) => setMessage(error instanceof Error ? error.message : "Battery backup failed."))} type="button">Export battery RAM</button>
      </div>
      {message && <p className="mt-3 text-xs font-semibold text-synth-secondary" role="status">{message}</p>}
    </section>
  );
}
