import { useCallback, useState } from "react";
import { isAuthCaptchaEnabled } from "../../lib/auth/captchaConfig";
import { useDeleteAccount } from "./useDeleteAccount";
import { useProfileAccountData } from "./useProfileAccountData";
import { useProfilePassword } from "./useProfilePassword";
import { usePublicProfileSettings } from "./usePublicProfileSettings";

export function useProfileSettings() {
  const account = useProfileAccountData();
  const publicProfile = usePublicProfileSettings({
    profile: account.profile,
    user: account.user,
  });
  const [passwordCaptchaToken, setPasswordCaptchaToken] = useState("");
  const [passwordCaptchaResetKey, setPasswordCaptchaResetKey] = useState(0);
  const [deleteCaptchaToken, setDeleteCaptchaToken] = useState("");
  const [deleteCaptchaResetKey, setDeleteCaptchaResetKey] = useState(0);
  const resetPasswordCaptchaChallenge = useCallback(() => {
    setPasswordCaptchaToken("");
    setPasswordCaptchaResetKey((key) => key + 1);
  }, []);
  const resetDeleteCaptchaChallenge = useCallback(() => {
    setDeleteCaptchaToken("");
    setDeleteCaptchaResetKey((key) => key + 1);
  }, []);
  const password = useProfilePassword({
    captchaToken: passwordCaptchaToken,
    onCaptchaChallengeReset: resetPasswordCaptchaChallenge,
    user: account.user,
  });
  const deleteAccount = useDeleteAccount({
    captchaToken: deleteCaptchaToken,
    hasPassword: account.hasPassword,
    onCaptchaChallengeReset: resetDeleteCaptchaChallenge,
    user: account.user,
  });

  return {
    activity: {
      entries: account.activity,
      error: account.activityError,
      loading: account.activityLoading,
      retry: account.retryActivity,
    },
    avatarModal: publicProfile.avatarModal,
    deleteModal: {
      captchaResetKey: deleteCaptchaResetKey,
      captchaToken: deleteCaptchaToken,
      close: deleteAccount.closeDeleteModal,
      deleteError: deleteAccount.deleteError,
      deleteInput: deleteAccount.deleteInput,
      handleDeleteAccount: deleteAccount.handleDeleteAccount,
      hasPassword: Boolean(account.hasPassword),
      isAuthCaptchaEnabled,
      isDeleting: deleteAccount.isDeleting,
      setCaptchaToken: setDeleteCaptchaToken,
      setDeleteInput: deleteAccount.setDeleteInput,
      show: deleteAccount.showDeleteModal,
    },
    loadError: account.loadError,
    loading: account.loading,
    navigate: account.navigate,
    publicProfile: publicProfile.section,
    retryLoad: account.retryLoad,
    security: {
      currentPassword: password.currentPassword,
      hasPassword: account.hasPassword,
      isAuthCaptchaEnabled,
      newPassword: password.newPassword,
      passwordCaptchaResetKey,
      passwordCaptchaToken,
      passwordMessage: password.passwordMessage,
      savingPassword: password.savingPassword,
      setCurrentPassword: password.setCurrentPassword,
      setDeleteModalVisible: deleteAccount.setShowDeleteModal,
      setNewPassword: password.setNewPassword,
      setPasswordCaptchaToken,
      updatePassword: password.updatePassword,
      userRole: account.userRole,
    },
  };
}
