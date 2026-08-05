import { Clock3, Loader2, Monitor, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { GameArtworkFallback } from "../../components/user/GameArtworkFallback";
import type { ProfileSettingsState } from "./ProfileSettingsState";
import { getGamePlayPath } from "../../lib/navigation/appUrl";

export function RecentActivitySection({ profile }: { profile: ProfileSettingsState }) {
  if (profile.activityLoading) return <section className="rounded-lg border border-synth-border bg-[#2B1720] p-6 shadow-card"><div className="flex items-center gap-2 text-sm font-semibold text-gray-300" role="status"><Loader2 className="h-4 w-4 animate-spin" />Loading recent activity…</div></section>;
  return (
    <section className="rounded-lg border border-synth-border bg-[#2B1720] p-6 shadow-card md:p-8">
      <div className="mb-5 flex items-center justify-between gap-4"><div><h2 className="flex items-center gap-2 text-xl font-bold text-white"><Clock3 className="h-5 w-5 text-synth-primary" />Recent Activity</h2><p className="mt-1 text-sm text-gray-400">Visible only to you.</p></div>{profile.activityError && <button className="rounded-md border border-synth-border px-3 py-2 text-sm font-bold text-white" onClick={() => void profile.retryActivity()} type="button">Retry</button>}</div>
      {profile.activityError ? <p className="rounded-md border border-red-500/30 bg-red-950/20 p-4 text-sm text-red-200">Recent activity could not be loaded.</p>
        : profile.activity.length === 0 ? <p className="rounded-md border border-synth-border bg-synth-bg/40 p-4 text-sm text-gray-400">Play a browser-compatible game for 30 seconds and it will appear here.</p>
          : <div className="space-y-3">{profile.activity.map((entry) => <Link className="group flex items-center gap-4 rounded-lg border border-synth-border bg-synth-bg/50 p-3 hover:bg-synth-elevated" key={`${entry.game_id}:${entry.client_edition}:${entry.runtime_kind}`} state={{ backRoute: "/profile", backText: "Back to Account Settings" }} to={getGamePlayPath(entry.game_id)}><div className="h-16 w-14 shrink-0 overflow-hidden rounded-md border border-synth-border bg-synth-bg">{entry.game.cover_url ? <img alt="" className="h-full w-full object-cover" decoding="async" loading="lazy" src={entry.game.cover_url} /> : <GameArtworkFallback className="h-full" title={entry.game.title} />}</div><div className="min-w-0 flex-1"><h3 className="truncate font-bold text-white group-hover:text-synth-secondary">{entry.game.title}</h3><div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400"><span className="inline-flex items-center gap-1"><Monitor className="h-3.5 w-3.5" />{entry.client_edition === "user" ? "User Edition" : "Studio Edition"} · {entry.runtime_kind.toUpperCase()}</span><span className="inline-flex items-center gap-1"><Play className="h-3.5 w-3.5" />{entry.play_count} {entry.play_count === 1 ? "play" : "plays"}</span></div></div><time className="hidden text-right text-xs text-gray-500 sm:block" dateTime={entry.last_played_at}>{new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(entry.last_played_at))}</time></Link>)}</div>}
    </section>
  );
}
