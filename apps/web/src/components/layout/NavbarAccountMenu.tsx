import { useEffect, useRef, useState } from "react";
import { Code, HardDrive, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { Avatar } from "../ui/Avatar";
import { PixelIcon } from "../ui/PixelIcon";

type Props = {
  avatarUrl?: string | null;
  isDeveloper: boolean;
  onSignOut: () => Promise<void>;
  user: User;
  username?: string | null;
};

export function NavbarAccountMenu({ avatarUrl, isDeveloper, onSignOut, user, username }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const closeOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", closeOutside);
    return () => document.removeEventListener("mousedown", closeOutside);
  }, []);
  const displayName = username || user.email;
  return (
    <div className="flex items-center gap-3">
      {isDeveloper && (
        <span className="hidden items-center gap-1 rounded-md border border-synth-border bg-synth-surface px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-white sm:flex">
          <Code className="h-3 w-3" />
          Dev
        </span>
      )}
      <div className="relative" ref={rootRef}>
        <button
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label="Open account menu"
          className="flex items-center gap-2 focus:outline-none"
          onClick={() => setOpen((value) => !value)}
          type="button"
        >
          <Avatar
            alt="User Avatar"
            className="border-2 border-transparent hover:border-synth-border"
            loading="eager"
            name={displayName}
            src={avatarUrl}
          />
        </button>
        {open && (
          <div
            className="absolute right-0 z-50 mt-2 w-48 rounded-lg border border-synth-border bg-synth-surface py-2 shadow-card"
            role="menu"
          >
            <span
              aria-hidden="true"
              className="absolute -top-2 right-3 h-4 w-4 rotate-45 border-l border-t border-synth-border bg-synth-surface"
            />
            <div className="mb-2 border-b border-synth-border px-4 py-2">
              <p className="truncate text-sm text-synth-secondary">Signed in as</p>
              <p className="truncate text-sm font-bold text-white">{displayName}</p>
            </div>
            <Link
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-synth-elevated hover:text-white"
              onClick={() => setOpen(false)}
              role="menuitem"
              to="/profile"
            >
              <PixelIcon className="h-4 w-4" name="profile" />
              Profile
            </Link>
            <Link
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-synth-elevated hover:text-white"
              onClick={() => setOpen(false)}
              role="menuitem"
              to="/storage"
            >
              <HardDrive className="h-4 w-4" />
              Device Storage
            </Link>
            <button
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-400 hover:bg-synth-elevated"
              onClick={() => {
                setOpen(false);
                void onSignOut();
              }}
              role="menuitem"
              type="button"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
