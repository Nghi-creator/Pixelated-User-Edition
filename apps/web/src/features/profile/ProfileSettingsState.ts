import type { useProfileSettings } from "./useProfileSettings";
export type ProfileSettingsState = ReturnType<typeof useProfileSettings>;
export type ProfileActivityState = ProfileSettingsState["activity"];
export type PublicProfileState = ProfileSettingsState["publicProfile"];
export type ProfileSecurityState = ProfileSettingsState["security"];
