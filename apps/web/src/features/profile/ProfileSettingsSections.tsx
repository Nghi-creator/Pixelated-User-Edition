import { AlertOctagon } from "lucide-react";
import { ProfileSkeleton } from "../../components/ui/Skeleton";

export { PublicProfileSection } from "./PublicProfileSection";
export { RecentActivitySection } from "./RecentActivitySection";
export { SecuritySection } from "./SecuritySection";
export function ProfileLoadingState() {
  return <div className="flex min-h-screen flex-col"><ProfileSkeleton /></div>;
}

export function ProfileLoadError({ loadError, onRetry }: { loadError: string; onRetry: () => void }) {
  return <div className="flex min-h-[70vh] items-center justify-center px-4"><div className="max-w-md rounded-lg border border-red-500/30 bg-synth-surface p-8 text-center shadow-card"><AlertOctagon className="mx-auto mb-4 h-10 w-10 text-red-400" /><h1 className="mb-2 text-xl font-bold text-white">Account settings unavailable</h1><p className="mb-6 text-sm text-gray-400">{loadError}</p><button className="mx-auto flex items-center gap-2 rounded-lg bg-synth-primary px-5 py-2.5 font-bold text-white" onClick={onRetry} type="button">Retry</button></div></div>;
}
