import { z } from "zod";
import type {
  ApiCatalogFiltersResponse,
  ApiFeaturedGamesResponse,
  ApiGame,
  ApiMeResponse,
  ApiPaginatedGamesResponse,
  ApiPermissionsResponse,
  ApiProfile,
  ApiProfileActivityEntry,
  ApiSessionResponse,
} from "./apiTypes";

const nullableString = z.string().nullable();
const optionalNullableString = nullableString.optional();

const gameBuildSchema = z.object({
  artifact_filename: nullableString,
  artifact_sha256: optionalNullableString,
  artifact_size: z.number().int().nonnegative().nullable().optional(),
  artifact_url: nullableString,
  enabled: z.boolean(),
  game_id: z.string(),
  id: z.string(),
  launch_manifest_id: optionalNullableString,
  platform_id: z.string(),
  runtime_id: z.string(),
  runtime_kind: z.enum(["libretro", "native_linux"]),
});

const gameRightsSchema = z.object({
  asset_license_spdx: optionalNullableString,
  attribution_text: optionalNullableString,
  code_license_spdx: optionalNullableString,
  commercial_use_allowed: z.boolean().nullable().optional(),
  cover_license_spdx: optionalNullableString,
  game_build_id: nullableString,
  game_id: z.string(),
  id: z.string().optional(),
  license_url: optionalNullableString,
  modification_allowed: z.boolean().nullable().optional(),
  noncommercial_hosting_allowed: z.boolean().nullable().optional(),
  original_release_url: optionalNullableString,
  permission_evidence_url: optionalNullableString,
  review_notes: optionalNullableString,
  source_url: optionalNullableString,
  verified_at: nullableString,
});

export const apiGameSchema: z.ZodType<ApiGame> = z.object({
  author_name: optionalNullableString,
  backdrop_url: optionalNullableString,
  cover_url: z.string(),
  game_builds: z.array(gameBuildSchema).optional(),
  game_rights: z.array(gameRightsSchema).optional(),
  genre_slug: optionalNullableString,
  id: z.string(),
  play_count: z.number().int().nonnegative().nullable().optional(),
  rom_filename: optionalNullableString,
  rom_url: optionalNullableString,
  title: z.string(),
});

export const apiCatalogFiltersSchema: z.ZodType<ApiCatalogFiltersResponse> = z.object({
  genres: z.array(z.string()),
  licenses: z.array(z.string()),
});

export const apiFeaturedGamesSchema: z.ZodType<ApiFeaturedGamesResponse> = z.object({
  featuredGames: z.array(apiGameSchema),
});

export const apiPaginatedGamesSchema: z.ZodType<ApiPaginatedGamesResponse> = z.object({
  featuredGames: z.array(apiGameSchema),
  games: z.array(apiGameSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive().max(100),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().positive(),
});

export const apiGameResponseSchema = z.object({ game: apiGameSchema });

export const favoriteGameSchema = z.object({
  cover_url: z.string(),
  id: z.string(),
  title: z.string(),
});

export const favoriteListSchema = z.object({ favorites: z.array(favoriteGameSchema) });

export const favoriteIdsSchema = z.object({
  favorites: z.array(
    z
      .object({ id: z.string().optional(), game_id: z.string().optional() })
      .refine((favorite) => Boolean(favorite.id || favorite.game_id)),
  ),
});

export const successSchema = z.object({ success: z.literal(true) });
export const favoritedSchema = z.object({ favorited: z.literal(true) });
export const voidSchema = z.undefined();

const userSchema = z.object({ email: nullableString, id: z.string() });

export const apiMeSchema: z.ZodType<ApiMeResponse> = z.object({ user: userSchema });

export const apiPermissionsSchema: z.ZodType<ApiPermissionsResponse> = z.object({
  abilities: z.object({
    canAccessAdmin: z.boolean(),
    canManageReports: z.boolean(),
    canManageUsers: z.boolean(),
    canPublishGames: z.boolean(),
    isBanned: z.boolean(),
  }),
  profile: z.object({
    avatar_url: nullableString,
    email: nullableString,
    is_banned: z.boolean(),
    is_developer: z.boolean(),
    role: z.string(),
    username: nullableString,
  }),
  user: userSchema,
});

export const apiProfileSchema: z.ZodType<ApiProfile> = z.object({
  avatar_url: nullableString,
  created_at: z.string().optional(),
  id: z.string().optional(),
  is_banned: z.boolean().optional(),
  role: z.string(),
  username: nullableString,
});

export const apiProfileResponseSchema = z.object({ profile: apiProfileSchema.nullable() });

export const apiProfileActivityEntrySchema: z.ZodType<ApiProfileActivityEntry> = z.object({
  client_edition: z.enum(["studio", "user"]),
  game: z.object({ cover_url: nullableString, id: z.string(), title: z.string() }),
  game_id: z.string(),
  last_played_at: z.string(),
  play_count: z.number().int().nonnegative(),
  runtime_kind: z.enum(["wasm", "webrtc", "native"]),
});

export const apiProfileActivitySchema = z.object({
  activity: z.array(apiProfileActivityEntrySchema),
});

export const apiSessionSchema: z.ZodType<ApiSessionResponse> = z.object({
  boot: z.object({
    artifactSha256: nullableString,
    artifactSize: z.number().int().positive().nullable(),
    browser: z.object({
      artifactUrlExpiresAt: nullableString,
      coreId: z.enum(["fceumm", "gambatte"]).nullable(),
      eligible: z.boolean(),
      reason: nullableString,
      systemId: z.enum(["nes", "gb", "gbc"]).nullable(),
    }),
    launchManifestId: nullableString,
    romFilename: nullableString,
    romUrl: nullableString,
    runtimeId: z.string(),
    runtimeKind: z.enum(["libretro", "native_linux"]),
  }),
  engineUrl: z.string(),
  expiresAt: z.string(),
  sessionId: z.string(),
  sessionToken: z.string(),
  user: z.object({ id: nullableString }),
});

export const commentSchema = z.object({
  comment_likes: z.array(z.object({ is_like: z.boolean(), user_id: z.string() })),
  content: z.string(),
  created_at: z.string(),
  id: z.string(),
  profiles: z.object({ avatar_url: nullableString, username: nullableString }).nullable(),
  user_id: z.string(),
});

export const commentsPageSchema = z.object({
  comments: z.array(commentSchema),
  hasMore: z.boolean(),
});

export const reactionsSchema = z.object({
  reactions: z.array(z.object({ is_like: z.boolean(), user_id: z.string() })),
});

export const browserSmokeSessionSchema = z.object({
  artifactFilename: z.string(),
  artifactSha256: z.string().regex(/^[a-f0-9]{64}$/i),
  artifactSize: z.number().int().positive(),
  candidateId: z.string(),
  coreId: z.enum(["fceumm", "gambatte"]),
  expiresAt: z.string(),
  systemId: z.enum(["nes", "gb", "gbc"]),
  title: z.string(),
});

export type FavoriteGame = z.infer<typeof favoriteGameSchema>;
export type GameComment = z.infer<typeof commentSchema>;
export type BrowserSmokeSession = z.infer<typeof browserSmokeSessionSchema>;
