import { RotateCcw, Search } from "lucide-react";
import { SelectMenu } from "../../components/ui/SelectMenu";
import { PLATFORM_OPTIONS } from "../../lib/browserCompatibility";
import { formatGenre } from "./catalogMetadata";

type RuntimeFilter = "all" | "browser" | "desktop" | "unavailable";
type Props = {
  availableGenres: string[];
  availableLicenses: string[];
  genre: string;
  hasActiveFilters: boolean;
  license: string;
  onGenreChange: (value: string) => void;
  onLicenseChange: (value: string) => void;
  onPlatformChange: (value: string) => void;
  onReset: () => void;
  onRuntimeChange: (value: RuntimeFilter) => void;
  onSearchChange: (value: string) => void;
  platform: string;
  runtime: RuntimeFilter;
  search: string;
};

export function GameCatalogToolbar(props: Props) {
  return (
    <div className="mb-8 space-y-3">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <h2 className="scroll-mt-24 text-2xl font-bold text-white" id="all-games">
          All Games
        </h2>
        <div className="grid w-full xl:max-w-4xl xl:grid-cols-4">
          <div className="relative w-full xl:col-span-2 xl:col-start-3">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              className="block w-full rounded-lg border border-synth-border bg-synth-bg py-2 pl-10 pr-3 text-white placeholder:text-gray-500 focus:border-synth-secondary focus:outline-none"
              onChange={(event) => props.onSearchChange(event.target.value)}
              placeholder="Search games..."
              type="text"
              value={props.search}
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <button
          className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg border border-synth-secondary/40 bg-synth-bg px-4 text-sm font-semibold text-white disabled:opacity-40"
          disabled={!props.hasActiveFilters}
          onClick={props.onReset}
          type="button"
        >
          <RotateCcw className="h-4 w-4" />
          Reset filters
        </button>
        <div className="grid w-full gap-3 sm:grid-cols-2 xl:max-w-4xl xl:grid-cols-4">
          <SelectMenu
            ariaLabel="Runtime availability"
            className="w-full"
            onChange={(value) => props.onRuntimeChange(value as RuntimeFilter)}
            options={[
              { label: "All runtimes", value: "all" },
              { label: "Play in browser", value: "browser" },
              { label: "Desktop required", value: "desktop" },
              { label: "Currently unavailable", value: "unavailable" },
            ]}
            value={props.runtime}
          />
          <SelectMenu
            ariaLabel="Game system"
            className="w-full"
            onChange={props.onPlatformChange}
            options={[
              { label: "All systems", value: "" },
              ...PLATFORM_OPTIONS.map((item) => ({ label: item.label, value: item.id })),
            ]}
            value={props.platform}
          />
          <SelectMenu
            ariaLabel="Game genre"
            className="w-full"
            onChange={props.onGenreChange}
            options={[
              { label: "All genres", value: "" },
              ...props.availableGenres.map((value) => ({ label: formatGenre(value), value })),
            ]}
            value={props.genre}
          />
          <SelectMenu
            ariaLabel="Game license"
            className="w-full"
            onChange={props.onLicenseChange}
            options={[
              { label: "All licenses", value: "" },
              ...props.availableLicenses.map((value) => ({ label: value, value })),
            ]}
            value={props.license}
          />
        </div>
      </div>
    </div>
  );
}
