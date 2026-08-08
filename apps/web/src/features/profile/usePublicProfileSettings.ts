import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { FormEvent } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { ApiProfile } from "../../lib/api/apiTypes";
import { api } from "../../lib/api/apiClient";
import { invalidateProfileQueries } from "../../lib/api/queryClient";
import { supabase } from "../../lib/auth/supabaseClient";
import { saveProfile } from "./profileMutations";
import type { ProfileMessage } from "./profileSettingsTypes";
import { useProfileAvatar } from "./useProfileAvatar";

export function usePublicProfileSettings({
  profile,
  user,
}: {
  profile: ApiProfile | null;
  user: SupabaseUser | null;
}) {
  const queryClient = useQueryClient();
  const profileMutationRef = useRef(false);
  const [profileMessage, setProfileMessage] = useState<ProfileMessage | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const profileUsername = profile?.username || "";
  const [usernameDraft, setUsernameDraft] = useState<{ baseValue: string; value: string } | null>(
    null,
  );
  const username =
    usernameDraft?.baseValue === profileUsername ? usernameDraft.value : profileUsername;
  const setUsername = (value: string) => setUsernameDraft({ baseValue: profileUsername, value });
  const avatar = useProfileAvatar({
    profileAvatarUrl: profile?.avatar_url || "",
    setProfileMessage,
  });

  const updateProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || profileMutationRef.current) return;
    profileMutationRef.current = true;
    setSavingProfile(true);
    setProfileMessage(null);

    try {
      const result = await saveProfile({
        avatarFile: avatar.avatarFile,
        currentAvatarUrl: avatar.avatarUrl,
        removeAvatar: async (path) => {
          const { error } = await supabase.storage.from("avatars").remove([path]);
          if (error) throw error;
        },
        updateAuthMetadata: async (finalAvatarUrl, finalUsername) => {
          const { error } = await supabase.auth.updateUser({
            data: { avatar_url: finalAvatarUrl, username: finalUsername },
          });
          if (error) throw error;
        },
        updateProfile: async (finalAvatarUrl, finalUsername) => {
          await api.updateProfile({ avatarUrl: finalAvatarUrl, username: finalUsername });
          await invalidateProfileQueries(queryClient);
        },
        uploadAvatar: async (file, path) => {
          const { error } = await supabase.storage
            .from("avatars")
            .upload(path, file, { contentType: "image/jpeg" });
          if (error) throw error;
          const {
            data: { publicUrl },
          } = supabase.storage.from("avatars").getPublicUrl(path);
          return publicUrl;
        },
        userId: user.id,
        username,
      });
      setUsername(username.trim());
      avatar.commitSavedAvatar(result.avatarUrl);
      setProfileMessage({
        type: result.warnings.length ? "warning" : "success",
        text: result.warnings.length ? result.warnings.join(" ") : "Profile updated successfully.",
      });
    } catch (error: unknown) {
      setProfileMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to update profile.",
      });
    } finally {
      profileMutationRef.current = false;
      setSavingProfile(false);
    }
  };

  return {
    avatarModal: {
      crop: avatar.crop,
      handleCropConfirm: avatar.handleCropConfirm,
      imageSrc: avatar.imageSrc,
      isCropping: avatar.isCropping,
      onCropComplete: avatar.onCropComplete,
      setCrop: avatar.setCrop,
      setShowCropper: avatar.setShowCropper,
      setZoom: avatar.setZoom,
      showCropper: avatar.showCropper,
      zoom: avatar.zoom,
    },
    section: {
      displayAvatar: avatar.displayAvatar,
      fileInputRef: avatar.fileInputRef,
      handleFileSelect: avatar.handleFileSelect,
      profileMessage,
      savingProfile,
      setUsername,
      updateProfile,
      user,
      username,
    },
  };
}
