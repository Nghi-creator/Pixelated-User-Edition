import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { LocalRomPicker } from "../../features/local-vault/LocalRomPicker";
import { LocalRomRecentsSection } from "../../features/local-vault/LocalRomRecentsSection";
import { LocalWasmWorkspace } from "../../features/local-vault/LocalWasmWorkspace";
import { useLocalRomSelection } from "../../features/local-vault/useLocalRomSelection";

export default function LocalVault() {
  const selection = useLocalRomSelection();

  if (selection.selectedFile && selection.selectedSystem) {
    return (
      <LocalWasmWorkspace
        file={selection.selectedFile}
        fileInputVersion={selection.fileInputVersion}
        isInspecting={selection.isInspecting}
        onClose={selection.clearSelection}
        onSelectFile={(file) => void selection.selectFile(file)}
        system={selection.selectedSystem}
      />
    );
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        className="group mb-6 inline-flex items-center gap-2 font-medium text-gray-400 hover:text-white"
        to="/home"
      >
        <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" /> Back to
        Library
      </Link>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white">Personal ROMs</h1>
        <p className="mt-2 max-w-3xl text-gray-400">
          Choose a ROM you are legally allowed to use. Supported NES, Game Boy, and Game Boy Color
          files run directly in this tab with WebAssembly.
        </p>
      </div>
      {selection.message && (
        <div
          className={`mb-6 rounded-lg border p-4 text-sm font-semibold ${selection.message.tone === "error" ? "border-red-500/40 bg-red-950/30 text-red-200" : "border-synth-border bg-synth-surface text-gray-200"}`}
          role={selection.message.tone === "error" ? "alert" : "status"}
        >
          {selection.message.text}
        </div>
      )}
      <LocalRomPicker
        fileInputVersion={selection.fileInputVersion}
        isInspecting={selection.isInspecting}
        onSelectFile={(file) => void selection.selectFile(file)}
      />
      <LocalRomRecentsSection onChanged={selection.refreshRecents} recents={selection.recents} />
    </div>
  );
}
