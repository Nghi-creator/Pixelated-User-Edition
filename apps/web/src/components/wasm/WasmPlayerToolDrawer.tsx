import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

type WasmPlayerToolDrawerProps = {
  children: ReactNode;
  description: string;
  onClose: () => void;
  size?: "default" | "wide";
  title: string;
};

export function WasmPlayerToolDrawer({
  children,
  description,
  onClose,
  size = "default",
  title,
}: WasmPlayerToolDrawerProps) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        aria-label={`Close ${title}`}
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />
      <aside
        aria-describedby="wasm-player-tool-description"
        aria-labelledby="wasm-player-tool-title"
        aria-modal="true"
        className={`absolute left-0 top-0 flex h-full w-full flex-col border-r border-synth-border bg-synth-bg shadow-2xl ${
          size === "wide" ? "max-w-3xl" : "max-w-md"
        }`}
        role="dialog"
      >
        <div className="flex items-center justify-between border-b border-synth-border px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-white" id="wasm-player-tool-title">
              {title}
            </h2>
            <p className="mt-1 text-xs text-gray-400" id="wasm-player-tool-description">
              {description}
            </p>
          </div>
          <button
            aria-label={`Close ${title}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-synth-border text-gray-400 transition-colors hover:bg-synth-elevated hover:text-white"
            onClick={onClose}
            title={`Close ${title}`}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
      </aside>
    </div>
  );
}
