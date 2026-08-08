import { AvatarCropModal, DeleteAccountModal } from "../../features/profile/ProfileModals";
import {
  ProfileLoadingState,
  ProfileLoadError,
  PublicProfileSection,
  RecentActivitySection,
  SecuritySection,
} from "../../features/profile/ProfileSettingsSections";
import { useProfileSettings } from "../../features/profile/useProfileSettings";

export default function Profile() {
  const profile = useProfileSettings();

  if (profile.loading) {
    return <ProfileLoadingState />;
  }

  if (profile.loadError) {
    return <ProfileLoadError loadError={profile.loadError} onRetry={profile.retryLoad} />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      {profile.avatarModal.showCropper && profile.avatarModal.imageSrc && (
        <AvatarCropModal
          crop={profile.avatarModal.crop}
          imageSrc={profile.avatarModal.imageSrc}
          isCropping={profile.avatarModal.isCropping}
          onCancel={() => profile.avatarModal.setShowCropper(false)}
          onConfirm={() => void profile.avatarModal.handleCropConfirm()}
          onCropChange={profile.avatarModal.setCrop}
          onCropComplete={profile.avatarModal.onCropComplete}
          onZoomChange={profile.avatarModal.setZoom}
          zoom={profile.avatarModal.zoom}
        />
      )}

      {profile.deleteModal.show && (
        <DeleteAccountModal
          deleteError={profile.deleteModal.deleteError}
          deleteInput={profile.deleteModal.deleteInput}
          hasPassword={profile.deleteModal.hasPassword}
          isDeleting={profile.deleteModal.isDeleting}
          isAuthCaptchaEnabled={profile.deleteModal.isAuthCaptchaEnabled}
          onCancel={profile.deleteModal.close}
          onCaptchaTokenChange={profile.deleteModal.setCaptchaToken}
          onDeleteInputChange={profile.deleteModal.setDeleteInput}
          onSubmit={profile.deleteModal.handleDeleteAccount}
          captchaResetKey={profile.deleteModal.captchaResetKey}
          captchaToken={profile.deleteModal.captchaToken}
        />
      )}

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full mt-8">
        <button
          onClick={() => profile.navigate("/home")}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 w-fit"
        >
          Back to Home
        </button>

        <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-white">Account Settings</h1>

        <div className="space-y-8">
          <PublicProfileSection profile={profile.publicProfile} />
          <RecentActivitySection profile={profile.activity} />
          <SecuritySection profile={profile.security} />
        </div>
      </div>
    </div>
  );
}
