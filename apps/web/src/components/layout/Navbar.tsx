import { ScrollText } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { PixelIcon } from "../ui/PixelIcon";
import { NavbarAccountMenu } from "./NavbarAccountMenu";
import { useNavbarAccount } from "./useNavbarAccount";

export default function Navbar() {
  const account = useNavbarAccount();
  const location = useLocation();
  const navigate = useNavigate();
  const iconClass = (active: boolean) => `inline-flex h-10 w-10 items-center justify-center rounded-md border transition-colors ${active ? "border-synth-border bg-synth-surface text-white" : "border-transparent text-gray-400 hover:border-synth-border/70 hover:bg-synth-surface/60 hover:text-white"}`;
  const guardFavorites = (event: React.MouseEvent) => {
    if (account.user) return;
    event.preventDefault(); alert("Please sign in to save and view your favorite games!"); navigate("/login");
  };
  return (
    <nav className="fixed top-0 z-50 w-full border-b border-synth-border/60 bg-synth-bg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <Link className="group flex min-h-10 items-center gap-2" to="/home"><PixelIcon className="h-7 w-7 text-synth-secondary group-hover:text-white" name="brand" /><span className="text-xl font-extrabold tracking-widest text-white">PIXELATED</span><span className="hidden text-[10px] font-bold uppercase tracking-[0.22em] text-synth-secondary sm:inline">User</span></Link>
          <Link className={iconClass(location.pathname === "/")} title="Intro Guide" to="/"><ScrollText className="h-5 w-5" /></Link>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <Link className={iconClass(location.pathname === "/local")} title="Personal ROMs" to="/local"><PixelIcon className="h-6 w-6" name="publish" /></Link>
          <Link className={iconClass(location.pathname === "/favorites")} onClick={guardFavorites} title="Cloud Favorites" to="/favorites"><PixelIcon className="h-6 w-6" name="favorites" /></Link>
          {account.user ? <NavbarAccountMenu avatarUrl={account.profile?.avatar_url} isDeveloper={Boolean(account.profile?.is_developer)} onSignOut={account.signOut} user={account.user} username={account.profile?.username} /> : <Link className="group flex items-center gap-3 rounded-md border border-synth-border bg-synth-surface py-1.5 pl-1.5 pr-4 hover:bg-synth-elevated" to="/login"><span className="flex h-8 w-8 items-center justify-center rounded bg-synth-elevated"><PixelIcon className="h-4 w-4 text-white" name="profile" /></span><span className="text-sm font-medium text-white">Sign In</span></Link>}
        </div>
      </div></div>
    </nav>
  );
}
