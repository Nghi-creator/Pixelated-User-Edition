import type { FormEvent } from "react";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { PASSWORD_MIN_LENGTH, PASSWORD_POLICY_HINT } from "../../lib/auth/passwordPolicy";
import { AuthCaptcha } from "../../components/auth/AuthCaptcha";
import { AuthSocialActions } from "./AuthSocialActions";

type Props = {
  captchaResetKey: number;
  captchaToken: string;
  confirmPassword: string;
  email: string;
  isAuthCaptchaEnabled: boolean;
  isLogin: boolean;
  loading: boolean;
  onConfirmPasswordChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onGithubAuth: () => void;
  onGoogleAuth: () => void;
  onGuestContinue: () => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onTokenChange: (value: string) => void;
  onToggleAuthMode: () => void;
  password: string;
  setShowConfirmPassword: (updater: (visible: boolean) => boolean) => void;
  setShowPassword: (updater: (visible: boolean) => boolean) => void;
  showConfirmPassword: boolean;
  showForgotPassword: () => void;
  showPassword: boolean;
};

function PasswordVisibilityButton({
  isVisible,
  label,
  onToggle,
}: {
  isVisible: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      aria-label={isVisible ? `Hide ${label}` : `Show ${label}`}
      className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-white/70 hover:text-white"
      onClick={onToggle}
      title={isVisible ? `Hide ${label}` : `Show ${label}`}
      type="button"
    >
      {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );
}

export function EmailAuthForm(props: Props) {
  return (
    <>
      <form className="space-y-4" onSubmit={props.onSubmit}>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/70" />
          <input
            className="w-full rounded-lg border border-synth-border bg-synth-bg py-3 pl-10 pr-4 text-white placeholder:text-white/70 focus:border-synth-secondary focus:outline-none"
            onChange={(event) => props.onEmailChange(event.target.value)}
            placeholder="Email address"
            required
            type="email"
            value={props.email}
          />
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/70" />
          <input
            className="w-full rounded-lg border border-synth-border bg-synth-bg py-3 pl-10 pr-11 text-white placeholder:text-white/70 focus:border-synth-secondary focus:outline-none"
            minLength={props.isLogin ? undefined : PASSWORD_MIN_LENGTH}
            onChange={(event) => props.onPasswordChange(event.target.value)}
            placeholder="Password"
            required
            type={props.showPassword ? "text" : "password"}
            value={props.password}
          />
          <PasswordVisibilityButton
            isVisible={props.showPassword}
            label="password"
            onToggle={() => props.setShowPassword((visible) => !visible)}
          />
        </div>
        {props.isLogin && (
          <div className="-mt-2 flex justify-end">
            <button
              className="text-sm text-synth-secondary hover:text-white"
              onClick={props.showForgotPassword}
              type="button"
            >
              Forgot Password?
            </button>
          </div>
        )}
        {!props.isLogin && (
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/70" />
            <input
              className="w-full rounded-lg border border-synth-border bg-synth-bg py-3 pl-10 pr-11 text-white placeholder:text-white/70 focus:border-synth-secondary focus:outline-none"
              minLength={PASSWORD_MIN_LENGTH}
              onChange={(event) => props.onConfirmPasswordChange(event.target.value)}
              onCopy={(event) => event.preventDefault()}
              onCut={(event) => event.preventDefault()}
              onPaste={(event) => event.preventDefault()}
              placeholder="Confirm password"
              required
              type={props.showConfirmPassword ? "text" : "password"}
              value={props.confirmPassword}
            />
            <PasswordVisibilityButton
              isVisible={props.showConfirmPassword}
              label="confirmed password"
              onToggle={() => props.setShowConfirmPassword((visible) => !visible)}
            />
          </div>
        )}
        {!props.isLogin && (
          <p className="-mt-2 text-xs leading-5 text-white/80">{PASSWORD_POLICY_HINT}</p>
        )}
        <AuthCaptcha onTokenChange={props.onTokenChange} resetKey={props.captchaResetKey} />
        <button
          className="flex w-full items-center justify-center rounded-lg bg-synth-primary py-3 font-bold text-white disabled:opacity-50"
          disabled={props.loading || (props.isAuthCaptchaEnabled && !props.captchaToken)}
          type="submit"
        >
          {props.loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : props.isLogin ? (
            "Sign In"
          ) : (
            "Sign Up"
          )}
        </button>
      </form>
      <AuthSocialActions
        isLogin={props.isLogin}
        onGithubAuth={props.onGithubAuth}
        onGoogleAuth={props.onGoogleAuth}
        onGuestContinue={props.onGuestContinue}
        onToggleAuthMode={props.onToggleAuthMode}
      />
    </>
  );
}
