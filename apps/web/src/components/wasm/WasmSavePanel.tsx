import { useRef, useState, type ChangeEvent } from "react";
import { HardDrive, Save } from "lucide-react";
import type { WasmCoreId, WasmSystemId } from "../../lib/runtime/wasm/coreRegistry";
import type { WasmPlayerStatus } from "../../lib/runtime/wasm/runtimeTypes";
import { useWasmSaveSlots } from "../../hooks/wasm/useWasmSaveSlots";
import type { WasmSaveSlot } from "../../lib/runtime/wasm/wasmSaveStore";
import { WasmSaveSlotCard } from "./WasmSaveSlotCard";

type Props = {
  captureBatterySave: () => Promise<Blob>;
  captureState: () => Promise<{ state: Blob; thumbnail?: Blob }>;
  gameKey: string;
  restoreState: (state: Blob) => Promise<void>;
  runtime: { core: WasmCoreId; system: WasmSystemId };
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
  return bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function WasmSavePanel({
  captureBatterySave,
  captureState,
  gameKey,
  restoreState,
  runtime,
  status,
  variant = "inline",
}: Props) {
  const importSlot = useRef<WasmSaveSlot>(1);
  const [batteryError, setBatteryError] = useState<string | null>(null);
  const inputId = `state-import-${gameKey.replace(/[^a-z0-9]/gi, "-")}`;
  const saves = useWasmSaveSlots({ captureState, gameKey, restoreState, runtime });
  const isRunning = status === "playing" || status === "paused";
  const importState = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void saves.importFile(importSlot.current, file);
  };
  return (
    <section
      aria-label="Browser save states"
      className={variant === "inline" ? "border-t border-synth-border bg-synth-bg/60 p-4" : ""}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        {variant === "inline" && (
          <div>
            <h2 className="flex items-center gap-2 font-bold text-white">
              <Save className="h-4 w-4" />
              Local save states
            </h2>
            <p className="mt-1 text-xs text-gray-400">
              Stored only in this browser. A state must be loaded with the same game and emulator
              core.
            </p>
          </div>
        )}
        {saves.storage && (
          <span
            className={`flex items-center gap-1 text-xs text-gray-500 ${variant === "drawer" ? "ml-auto" : ""}`}
            title="Overall browser storage usage"
          >
            <HardDrive className="h-3.5 w-3.5" />
            {formatBytes(saves.storage.usage)} of {formatBytes(saves.storage.quota)} used
          </span>
        )}
      </div>
      <input
        accept=".state,.savestate"
        className="sr-only"
        id={inputId}
        onChange={importState}
        type="file"
      />
      <div className={`grid gap-2 ${variant === "inline" ? "md:grid-cols-3" : "grid-cols-1"}`}>
        {([1, 2, 3] as WasmSaveSlot[]).map((slot) => {
          const record = saves.records.find((item) => item.slot === slot);
          return (
            <WasmSaveSlotCard
              busy={saves.busySlot !== null}
              importInputId={inputId}
              isRunning={isRunning}
              key={slot}
              onDelete={() => void saves.remove(slot)}
              onExport={() => record && downloadBlob(record.state, `pixelated-slot-${slot}.state`)}
              onImport={() => {
                importSlot.current = slot;
              }}
              onLoad={() => record && void saves.load(slot, record)}
              onSave={() => void saves.save(slot)}
              record={record}
              runtime={runtime}
              slot={slot}
            />
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-gray-500">
          If storage is cleared or full, export important states and remove old site data in browser
          settings.
        </p>
        <button
          className="rounded border border-synth-border px-3 py-1.5 text-xs font-bold text-gray-300 disabled:opacity-40"
          disabled={!isRunning}
          onClick={() => {
            setBatteryError(null);
            void captureBatterySave()
              .then((blob) => downloadBlob(blob, "pixelated-battery.srm"))
              .catch((error) =>
                setBatteryError(error instanceof Error ? error.message : "Battery backup failed."),
              );
          }}
          type="button"
        >
          Export battery RAM
        </button>
      </div>
      {(saves.message || batteryError) && (
        <p className="mt-3 text-xs font-semibold text-synth-secondary" role="status">
          {saves.message || batteryError}
        </p>
      )}
    </section>
  );
}
