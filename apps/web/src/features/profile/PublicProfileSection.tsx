import { Avatar } from "../../components/ui/Avatar";
import type { PublicProfileState } from "./ProfileSettingsState";

export function PublicProfileSection({ profile }: { profile: PublicProfileState }) {
  const {
    displayAvatar,
    fileInputRef,
    handleFileSelect,
    profileMessage,
    savingProfile,
    setUsername,
    updateProfile,
    user,
    username,
  } = profile;
  return (
    <section className="rounded-lg border border-synth-border bg-[#2B1720] p-6 shadow-card md:p-8">
      <h2 className="mb-6 text-xl font-bold text-white">Public Profile</h2>
      {profileMessage && (
        <div
          className={`mb-6 rounded-lg border p-4 ${profileMessage.type === "success" ? "border-[#C02066]/50 bg-[#9B0048]/15 text-[#F38BB4]" : profileMessage.type === "warning" ? "border-synth-primary/50 bg-synth-primary/10 text-synth-secondary" : "danger-panel font-bold"}`}
          role={profileMessage.type === "error" ? "alert" : "status"}
        >
          {profileMessage.text}
        </div>
      )}
      <form className="space-y-8" onSubmit={updateProfile}>
        <div className="flex flex-col items-center gap-6">
          <button
            aria-label="Choose a new avatar"
            className="group relative h-24 w-24 overflow-hidden rounded-full border-2 border-transparent shadow-card hover:border-synth-border"
            disabled={savingProfile}
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            <Avatar
              alt="Avatar"
              className="h-full w-full border-0"
              loading="eager"
              name={username || user?.email}
              size="lg"
              src={displayAvatar}
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-[10px] font-bold uppercase tracking-wider text-white opacity-0 group-hover:opacity-100">
              Change
            </span>
          </button>
          <input
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
            ref={fileInputRef}
            type="file"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-400" htmlFor="profile-email">
            Email Address
          </label>
          <input
            className="w-full cursor-not-allowed rounded-lg border border-synth-border bg-synth-bg/50 px-4 py-3 text-gray-500"
            disabled
            id="profile-email"
            type="email"
            value={user?.email || ""}
          />
        </div>
        <div>
          <label
            className="mb-2 block text-sm font-medium text-gray-300"
            htmlFor="profile-username"
          >
            Username
          </label>
          <input
            className="w-full rounded-lg border border-synth-border bg-synth-bg px-4 py-3 text-white focus:border-synth-secondary focus:outline-none"
            disabled={savingProfile}
            id="profile-username"
            maxLength={80}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Enter a cool username"
            required
            type="text"
            value={username}
          />
        </div>
        <button
          className="flex items-center gap-2 rounded-lg bg-synth-primary px-6 py-2.5 font-bold text-white hover:bg-synth-primary-hover"
          disabled={savingProfile || !username.trim()}
          type="submit"
        >
          {savingProfile ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </section>
  );
}
