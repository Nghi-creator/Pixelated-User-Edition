import { Clock3, Gamepad2, Trash2 } from "lucide-react";
import {
  clearLocalRomRecents,
  removeLocalRomRecent,
  type LocalRomRecent,
} from "../../lib/local-rom/localRomRecents";

type Props = {
  onChanged: () => Promise<void>;
  recents: LocalRomRecent[];
};

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function LocalRomRecentsSection({ onChanged, recents }: Props) {
  return (
    <section className="rounded-lg border border-synth-border bg-synth-surface p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-white">
            <Clock3 className="h-5 w-5" /> Recent local files
          </h2>
          <p className="mt-1 text-xs text-white">Metadata only. Select the original file again to play it.</p>
        </div>
        {recents.length > 0 && (
          <button className="text-sm font-bold text-white hover:text-red-300" onClick={() => void clearLocalRomRecents().then(onChanged)} type="button">
            Clear history
          </button>
        )}
      </div>
      {recents.length === 0 ? (
        <div className="flex items-center gap-3 rounded-md border border-synth-border bg-synth-bg/50 p-4 text-sm text-gray-400">
          <Gamepad2 className="h-5 w-5" /> No local files opened yet.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {recents.map((recent) => (
            <article className="flex min-w-0 items-center gap-3 rounded-md border border-synth-border bg-synth-bg/50 p-3" key={recent.id}>
              <Gamepad2 className="h-6 w-6 shrink-0 text-synth-secondary" />
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-bold text-white">{recent.title}</h3>
                <p className="truncate text-xs text-gray-500">{recent.systemLabel} · {formatBytes(recent.size)} · {recent.fileName}</p>
              </div>
              <button aria-label={`Remove ${recent.title} from recent files`} className="rounded p-2 text-gray-500 hover:bg-red-950/30 hover:text-red-300" onClick={() => void removeLocalRomRecent(recent.id).then(onChanged)} type="button">
                <Trash2 className="h-4 w-4" />
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
