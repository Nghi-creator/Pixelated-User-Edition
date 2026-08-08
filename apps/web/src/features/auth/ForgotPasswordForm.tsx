import type { FormEvent } from "react";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { AuthCaptcha } from "../../components/auth/AuthCaptcha";

type Props = {
  captchaResetKey: number;
  captchaToken: string;
  email: string;
  isAuthCaptchaEnabled: boolean;
  loading: boolean;
  onEmailChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onTokenChange: (value: string) => void;
  showSignIn: () => void;
};

export function ForgotPasswordForm(props: Props) {
  return (
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
      <AuthCaptcha onTokenChange={props.onTokenChange} resetKey={props.captchaResetKey} />
      <button
        className="flex w-full items-center justify-center rounded-lg bg-synth-primary py-3 font-bold text-white disabled:opacity-50"
        disabled={props.loading || (props.isAuthCaptchaEnabled && !props.captchaToken)}
        type="submit"
      >
        {props.loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send Reset Link"}
      </button>
      <button
        className="mt-4 flex w-full items-center justify-center gap-2 text-sm text-white/80 hover:text-white"
        onClick={props.showSignIn}
        type="button"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Sign In
      </button>
    </form>
  );
}
