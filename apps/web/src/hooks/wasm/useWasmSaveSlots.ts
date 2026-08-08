import { useCallback, useEffect, useState } from "react";
import type { WasmCoreId, WasmSystemId } from "../../lib/runtime/wasm/coreRegistry";
import {
  createWasmSaveRecord,
  deleteWasmSaveRecord,
  getSaveStorageEstimate,
  listWasmSaveRecords,
  putWasmSaveRecord,
  validateImportedState,
  type WasmSaveRecord,
  type WasmSaveSlot,
} from "../../lib/runtime/wasm/wasmSaveStore";

type Options = {
  captureState: () => Promise<{ state: Blob; thumbnail?: Blob }>;
  gameKey: string;
  restoreState: (state: Blob) => Promise<void>;
  runtime: { core: WasmCoreId; system: WasmSystemId };
};

export function useWasmSaveSlots({ captureState, gameKey, restoreState, runtime }: Options) {
  const [busySlot, setBusySlot] = useState<WasmSaveSlot | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [records, setRecords] = useState<WasmSaveRecord[]>([]);
  const [storage, setStorage] = useState<{ quota: number; usage: number } | null>(null);
  const refresh = useCallback(async () => {
    setRecords(await listWasmSaveRecords(gameKey));
    setStorage(await getSaveStorageEstimate());
  }, [gameKey]);
  useEffect(() => {
    void refresh().catch(() => setMessage("Browser save storage is unavailable."));
  }, [refresh]);
  const run = useCallback(
    async (slot: WasmSaveSlot, action: () => Promise<string>) => {
      setBusySlot(slot);
      setMessage(null);
      try {
        setMessage(await action());
        await refresh();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "The save operation failed.");
      } finally {
        setBusySlot(null);
      }
    },
    [refresh],
  );
  const save = (slot: WasmSaveSlot) =>
    run(slot, async () => {
      const captured = await captureState();
      await putWasmSaveRecord(
        createWasmSaveRecord(gameKey, slot, captured.state, runtime, captured.thumbnail),
      );
      return `Saved slot ${slot}.`;
    });
  const load = (slot: WasmSaveSlot, record: WasmSaveRecord) =>
    run(slot, async () => {
      if (record.core !== runtime.core || record.system !== runtime.system)
        throw new Error("This save was created by a different emulator core.");
      await restoreState(record.state);
      return `Loaded slot ${slot}.`;
    });
  const importFile = (slot: WasmSaveSlot, file: File) =>
    run(slot, async () => {
      validateImportedState(file);
      await putWasmSaveRecord(createWasmSaveRecord(gameKey, slot, file, runtime));
      return `Imported into slot ${slot}. Start the same game before loading it.`;
    });
  const remove = (slot: WasmSaveSlot) =>
    run(slot, async () => {
      await deleteWasmSaveRecord(gameKey, slot);
      return `Deleted slot ${slot}.`;
    });
  return { busySlot, importFile, load, message, records, remove, save, storage };
}
