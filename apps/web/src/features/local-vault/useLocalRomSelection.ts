import { useCallback, useEffect, useState } from "react";
import { inspectLocalRomFile, type LocalRomSystemId } from "../../lib/local-rom/localRom";
import {
  createLocalRomRecent,
  listLocalRomRecents,
  saveLocalRomRecent,
  type LocalRomRecent,
} from "../../lib/local-rom/localRomRecents";

export type SelectedLocalRomSystem = { id: LocalRomSystemId; label: string };
export type LocalRomSelectionMessage = { text: string; tone: "error" | "info" };

export function useLocalRomSelection() {
  const [fileInputVersion, setFileInputVersion] = useState(0);
  const [isInspecting, setIsInspecting] = useState(false);
  const [message, setMessage] = useState<LocalRomSelectionMessage | null>(null);
  const [recents, setRecents] = useState<LocalRomRecent[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedSystem, setSelectedSystem] = useState<SelectedLocalRomSystem | null>(null);

  const refreshRecents = useCallback(async () => {
    try {
      setRecents(await listLocalRomRecents());
    } catch {
      setRecents([]);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void listLocalRomRecents().then(
      (rows) => {
        if (active) setRecents(rows);
      },
      () => {
        if (active) setRecents([]);
      },
    );
    return () => {
      active = false;
    };
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedFile(null);
    setSelectedSystem(null);
  }, []);

  const selectFile = useCallback(
    async (file: File) => {
      setIsInspecting(true);
      setMessage(null);
      try {
        const inspection = await inspectLocalRomFile(file);
        const system = { id: inspection.system.id, label: inspection.system.label };
        setSelectedSystem(system);
        let historySaved = true;
        try {
          await saveLocalRomRecent(createLocalRomRecent(file, system));
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
        clearSelection();
        setMessage({
          tone: "error",
          text: error instanceof Error ? error.message : "Could not inspect this ROM file.",
        });
      } finally {
        setIsInspecting(false);
        setFileInputVersion((version) => version + 1);
      }
    },
    [clearSelection, refreshRecents],
  );

  return {
    clearSelection,
    fileInputVersion,
    isInspecting,
    message,
    recents,
    refreshRecents,
    selectedFile,
    selectedSystem,
    selectFile,
  };
}
