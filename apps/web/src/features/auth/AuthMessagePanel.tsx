import { Loader2 } from "lucide-react";

type Props = {
  captchaToken: string;
  error: string | null;
  isAuthCaptchaEnabled: boolean;
  message: string | null;
  onResendConfirmation: () => void;
  resendCooldown: number;
  resendLoading: boolean;
  verificationPendingEmail: string | null;
};

export function AuthMessagePanel({
  captchaToken,
  error,
  isAuthCaptchaEnabled,
  message,
  onResendConfirmation,
  resendCooldown,
  resendLoading,
  verificationPendingEmail,
}: Props) {
  return (
    <>
      {error && (
        <div
          className="danger-panel mb-6 rounded-lg border px-4 py-3 text-center text-sm font-bold"
          role="alert"
        >
          {error}
        </div>
      )}
      {message && (
        <div
          className="mb-6 rounded-lg border border-[#C02066]/50 bg-[#9B0048]/15 px-4 py-3 text-center text-sm text-[#F38BB4]"
          role="status"
        >
          <p>{message}</p>
          {verificationPendingEmail && (
            <button
              className="mt-3 inline-flex items-center justify-center gap-2 rounded-md border border-[#C02066]/50 bg-[#9B0048]/20 px-3 py-2 font-semibold disabled:opacity-50"
              disabled={
                resendLoading || resendCooldown > 0 || (isAuthCaptchaEnabled && !captchaToken)
              }
              onClick={onResendConfirmation}
              type="button"
            >
              {resendLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {resendCooldown > 0
                ? `Resend available in ${resendCooldown}s`
                : "Resend verification email"}
            </button>
          )}
        </div>
      )}
    </>
  );
}
