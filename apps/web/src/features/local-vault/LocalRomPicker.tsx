import { useState, type ChangeEvent, type DragEvent } from "react";
import { Loader2, Upload } from "lucide-react";

export const ACCEPTED_ROM_EXTENSIONS = ".nes,.gb,.gbc,.gba,.sfc,.smc,.md,.gen,.sms,.gg";

type Props = {
  fileInputVersion: number;
  isInspecting: boolean;
  onSelectFile: (file: File) => void;
};

export function LocalRomPicker({ fileInputVersion, isInspecting, onSelectFile }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onSelectFile(file);
  };
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) onSelectFile(file);
  };

  return (
    <div
      className={`relative mb-10 flex h-60 flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 text-center transition-colors ${isDragging ? "border-synth-primary bg-synth-elevated" : "border-synth-border bg-synth-bg hover:border-synth-primary"}`}
      onDragLeave={(event) => {
        event.preventDefault();
        setIsDragging(false);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDrop={handleDrop}
    >
      <input
        accept={ACCEPTED_ROM_EXTENSIONS}
        className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
        disabled={isInspecting}
        key={fileInputVersion}
        onChange={handleInput}
        type="file"
      />
      {isInspecting ? (
        <Loader2 className="mb-4 h-12 w-12 animate-spin text-white" />
      ) : (
        <Upload className="mb-4 h-12 w-12 text-synth-secondary" />
      )}
      <h2 className="text-xl font-bold text-white">
        {isInspecting ? "Inspecting locally…" : "Drop a ROM here or choose a file"}
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-gray-400">
        NES, Game Boy, and Game Boy Color launch in this browser. GBA, SNES, Genesis, Master System,
        and Game Gear are detected for future cores.
      </p>
    </div>
  );
}
