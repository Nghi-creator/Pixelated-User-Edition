import { useEffect, useMemo } from "react";
import { Download, Trash2, Upload } from "lucide-react";
import type { WasmCoreId, WasmSystemId } from "../../../lib/runtime/wasm/coreRegistry";
import type { WasmSaveRecord, WasmSaveSlot } from "../saves/wasmSaveStore";

type Props = {
  busy: boolean; importInputId: string; isRunning: boolean; onDelete: () => void;
  onExport: () => void; onImport: () => void; onLoad: () => void; onSave: () => void;
  record?: WasmSaveRecord; runtime: { core: WasmCoreId; system: WasmSystemId }; slot: WasmSaveSlot;
};

function SaveThumbnail({ blob }: { blob: Blob }) {
  const url = useMemo(() => URL.createObjectURL(blob), [blob]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return <img alt="Save-state preview" className="h-10 w-14 rounded object-cover" src={url} />;
}

export function WasmSaveSlotCard({ busy, importInputId, isRunning, onDelete, onExport, onImport, onLoad, onSave, record, runtime, slot }: Props) {
  const compatible = Boolean(record && record.core === runtime.core && record.system === runtime.system);
  return (
    <article className="rounded-md border border-synth-border bg-synth-bg p-3">
      <div className="mb-3 flex items-start justify-between gap-2"><div><h3 className="text-sm font-bold text-white">Slot {slot}</h3><p className="text-xs text-gray-500">{record ? new Date(record.createdAt).toLocaleString() : "Empty"}</p></div>{record?.thumbnail && <SaveThumbnail blob={record.thumbnail} />}</div>
      <div className="flex flex-wrap gap-1.5">
        <button className="rounded border border-synth-border px-2 py-1 text-xs font-bold text-white disabled:opacity-40" disabled={!isRunning || busy} onClick={onSave} type="button">Save</button>
        <button className="rounded border border-synth-border px-2 py-1 text-xs font-bold text-white disabled:opacity-40" disabled={!compatible || !isRunning || busy} onClick={onLoad} title={record && !compatible ? "This slot belongs to a different emulator core." : undefined} type="button">Load</button>
        <label className="cursor-pointer rounded border border-synth-border px-2 py-1 text-xs font-bold text-gray-300" htmlFor={importInputId} onClick={onImport}><Upload className="mr-1 inline h-3 w-3" />Import</label>
        <button aria-label={`Export slot ${slot}`} className="rounded border border-synth-border p-1 text-gray-300 disabled:opacity-40" disabled={!record} onClick={onExport} type="button"><Download className="h-3.5 w-3.5" /></button>
        <button aria-label={`Delete slot ${slot}`} className="rounded border border-synth-border p-1 text-gray-400 disabled:opacity-40" disabled={!record || busy} onClick={onDelete} type="button"><Trash2 className="h-3.5 w-3.5" /></button>
      </div>
    </article>
  );
}
