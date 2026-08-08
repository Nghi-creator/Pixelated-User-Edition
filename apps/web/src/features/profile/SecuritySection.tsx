import { AlertOctagon } from "lucide-react";
import { AuthCaptcha } from "../../components/auth/AuthCaptcha";
import { PASSWORD_MIN_LENGTH, PASSWORD_POLICY_HINT } from "../../lib/auth/passwordPolicy";
import type { ProfileSecurityState } from "./ProfileSettingsState";

function PasswordField({
  disabled,
  label,
  minLength,
  onChange,
  placeholder,
  value,
}: {
  disabled: boolean;
  label: string;
  minLength?: number;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  const id = `profile-${label.toLowerCase().replaceAll(" ", "-")}`;
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-300" htmlFor={id}>
        {label}
      </label>
      <input
        className="w-full rounded-lg border border-synth-border bg-synth-bg px-4 py-3 text-white focus:border-red-400 focus:outline-none"
        disabled={disabled}
        id={id}
        minLength={minLength}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required
        type="password"
        value={value}
      />
    </div>
  );
}

export function SecuritySection({ profile }: { profile: ProfileSecurityState }) {
  const {
    currentPassword,
    hasPassword,
    isAuthCaptchaEnabled,
    newPassword,
    passwordCaptchaResetKey,
    passwordCaptchaToken,
    passwordMessage,
    savingPassword,
    setCurrentPassword,
    setNewPassword,
    setPasswordCaptchaToken,
    setDeleteModalVisible,
    updatePassword,
    userRole,
  } = profile;
  return (
    <section className="rounded-lg border border-synth-border bg-[#2B1720] p-6 shadow-card md:p-8">
      <h2 className="mb-6 text-xl font-bold text-white">Security</h2>
      {passwordMessage && (
        <div
          className={`mb-6 rounded-lg border p-4 ${passwordMessage.type === "success" ? "border-[#C02066]/50 bg-[#9B0048]/15 text-[#F38BB4]" : "danger-panel font-bold"}`}
          role={passwordMessage.type === "error" ? "alert" : "status"}
        >
          {passwordMessage.text}
        </div>
      )}
      {hasPassword ? (
        <form className="space-y-6" onSubmit={updatePassword}>
          <PasswordField
            disabled={savingPassword}
            label="Current Password"
            onChange={setCurrentPassword}
            placeholder="Enter current password"
            value={currentPassword}
          />
          <PasswordField
            disabled={savingPassword}
            label="New Password"
            minLength={PASSWORD_MIN_LENGTH}
            onChange={setNewPassword}
            placeholder="Enter new password"
            value={newPassword}
          />
          <p className="text-xs leading-5 text-gray-400">{PASSWORD_POLICY_HINT}</p>
          <AuthCaptcha onTokenChange={setPasswordCaptchaToken} resetKey={passwordCaptchaResetKey} />
          <button
            className="flex items-center gap-2 rounded-lg bg-synth-primary px-6 py-2.5 font-bold text-white hover:bg-synth-primary-hover"
            disabled={savingPassword || (isAuthCaptchaEnabled && !passwordCaptchaToken)}
            type="submit"
          >
            {savingPassword ? "Updating..." : "Update Password"}
          </button>
        </form>
      ) : (
        <p className="rounded-lg border border-synth-border bg-synth-bg/40 p-4 text-sm text-gray-400">
          This account signs in through an external provider. Manage its password with that
          provider.
        </p>
      )}
      {userRole !== "admin" && userRole !== "super_admin" && (
        <div className="mt-10 border-t border-synth-border pt-8">
          <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-red-300">
            <AlertOctagon className="h-5 w-5" />
            Danger Zone
          </h3>
          <p className="mb-6 text-sm text-gray-400">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <button
            className="danger-action rounded-lg border px-6 py-2.5 font-bold"
            onClick={() => setDeleteModalVisible(true)}
            type="button"
          >
            Delete Account
          </button>
        </div>
      )}
    </section>
  );
}
