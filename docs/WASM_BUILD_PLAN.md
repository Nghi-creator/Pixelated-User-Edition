# Pixelated User Edition — WebAssembly Build Plan

## 1. Goal

Build a browser-first edition of Pixelated that runs eligible games locally through WebAssembly. Reuse the existing catalog, accounts, community features, API, and Supabase project while keeping the Studio Edition's WebRTC/desktop-engine path separate.

The first release should prove one thing well: a user can choose an eligible game and play it quickly in a modern browser without installing the desktop engine.

## 2. Product boundary

- **Studio Edition:** WebRTC streaming, desktop/local engine, LAN-oriented workflows, research telemetry, native runtimes, and broad system access.
- **User Edition:** browser delivery, local WASM emulation, catalog/community browsing, low-friction play, and browser-safe persistence.
- Both editions may share the API and database, but must use the same migrations, RLS policies, schema contracts, and environment ownership rules.
- Do not fork business rules silently. Shared endpoints and types should remain compatible or be versioned explicitly.

## 3. Current repository starting point

- `apps/web` is the canonical User Edition frontend.
- `services/api` supplies catalog, authentication, session, reaction, comment, report, and artifact metadata endpoints.
- `supabase` contains the shared schema and policies.
- The copied web app still contains Studio-only screens. They can remain temporarily, but User Edition navigation should progressively hide or replace them.
- Secrets belong only in ignored local environment files and deployment secret stores. Commit only `.env.example` templates.

## 4. Features we can include first

### 4.1 WASM gameplay MVP

- [x] Runtime abstraction independent from WebRTC.
- [x] Lazy-load the emulator package in a separate `wasm-runtime` bundle.
- [x] NES support using Nostalgist and the `fceumm` libretro core.
- [x] Game Boy and Game Boy Color support using the `gambatte` libretro core.
- [x] User-gesture launch to satisfy browser audio restrictions.
- [x] Stream ROM downloads and display progress.
- [x] Enforce a 64 MB client safety limit.
- [x] Validate the NES header, expected size, and SHA-256 checksum.
- [x] Explicit idle, download, verification, core-loading, playing, paused, stopped, and error states.
- [x] Pause, resume, reset, stop, mute, volume, fullscreen, and pixel-perfect controls.
- [x] Keyboard input plus connected-gamepad detection.
- [x] Create and clean up authenticated backend sessions.
- [x] Keep play-count behavior, but start its timer only after gameplay begins.
- [x] Remove `/play/:id` from the desktop-engine route guard.
- [x] Give unsupported systems a clear browser-core availability error instead of attempting a broken launch.
- [ ] Test the supported browser matrix on current Chrome, Edge, Firefox, and Safari.
- [ ] Measure first-play download, startup time, memory use, and bundle-cache behavior.

### 4.2 Catalog and discovery

- [x] Browse, server-ranked search, pagination, artwork, rights, author, and license links.
- [x] Favorites and profile-linked library state.
- [x] Eligibility badges: “Play in browser,” “Desktop required,” and “Currently unavailable.”
- [x] Correct server-side filters for system and runtime availability, including filtered pagination totals and cache keys.
- [x] Friendly pre-launch unavailable-artifact, native-runtime, and unsupported-system states.
- [x] Tested compatibility policy based on enabled build, runtime kind, platform, extension, size, and checksum metadata.
- [x] Genre facets backed by normalized shared catalog metadata, server-side filtering, and correct pagination/cache separation.
- [x] License facets derived from verified code/asset SPDX metadata and filtered server-side in both editions.

### 4.3 Accounts and community

- [x] Existing Supabase authentication, social-provider, password, CAPTCHA, profile, avatar, and account-deletion flows.
- [x] Favorites, likes/dislikes, comments, comment reactions, reports, role checks, and moderation remain shared across editions.
- [x] Global play counts are recorded only after 30 seconds of active gameplay.
- [x] Privacy-scoped recent activity appears on the account page and is readable only by its owner.
- [x] Activity is aggregated per user/game/edition/runtime instead of creating an unlimited event log.
- [x] `client_edition` and `runtime_kind` distinguish User Edition WASM from Studio WebRTC/native activity.
- [x] Account deletion cascades to activity records through the existing auth-user ownership model.

### 4.4 Personal ROMs

- [x] Local file picker and drag-and-drop launch without uploading the ROM.
- [x] Browser-side size, extension, system, and NES-header validation.
- [x] NES files run directly from an in-memory `File` source through the existing WASM runtime.
- [x] GB, GBC, GBA, SNES, Genesis, Master System, and Game Gear files are detected with honest future-core messaging.
- [x] Recent-local-game metadata is stored in IndexedDB; ROM bytes are never persisted.
- [x] Users can remove individual recent entries or clear local history.
- [x] Clear privacy and legal-use messaging explains that local files remain on the device.
- [x] `/local` no longer requires desktop-engine pairing in User Edition.
- [ ] **Deferred post-v1:** optionally persist ROM bytes in IndexedDB only after explicit per-game consent. This must include quota/eviction handling, clear deletion controls, legal-use messaging, and a memory-only default. Do this after keyboard/gamepad remapping, not as part of v1.

### 4.5 Saves and usability

- [x] Three versioned, per-game save-state slots are stored in a dedicated IndexedDB database.
- [x] Save states can be imported, exported, loaded, overwritten, and deleted with size/type validation.
- [x] Battery RAM can be backed up as an export. Restore remains pending because Nostalgist 0.21 exposes no supported SRAM-load API.
- [x] Per-game touch A/B layout remapping and compact, large-target, and high-contrast accessibility presets.
- [x] Pointer-safe touch controls for mobile-sized screens, including D-pad, A/B, Start, and Select.
- [x] Keyboard/gamepad remapping uses a pre-launch browser input layer with conflict validation, accessible defaults, per-controller profiles, reset controls, and local persistence.
- PWA shell and offline replay for assets the user is legally allowed to cache.
- [x] Browser storage quota/usage checks and recovery/export instructions.

### 4.6 Research measurements that fit the browser

- [x] ROM download, verification, emulator-core load, and launch-to-first-browser-frame timings.
- [x] Animation-frame pacing, dropped-frame estimates, long tasks, supported JS heap estimates, and runtime errors.
- [x] Browser/OS capability snapshot is captured only after explicit informed consent.
- [x] Exportable TAR bundle with User Edition/WASM metadata, summary JSON, frame/long-task CSV files, and runtime errors.

## 5. Features that require changes

### 5.1 Backend and artifact delivery

- [x] Return runtime kind, ROM filename, byte size, SHA-256, and a short-lived browser-readable artifact URL from the boot contract.
- [x] Allow the deployed User Edition origin through API CORS; verify signed Supabase Storage artifact CORS during deployment.
- [x] Issue five-minute signed URLs from server-only Supabase credentials; canonical ROM URLs point to a private bucket and are unusable unsigned.
- [x] Return authoritative browser eligibility metadata for artifact, core, and system.
- [x] Rate-limit session creation and signed artifact URL issuance independently per authenticated user.
- [x] Anonymous demo sessions are disabled; browser artifact issuance requires authentication.

### 5.2 Shared API and database

- [x] Pixelated Studio Edition is the sole migration authority for the shared Supabase project.
- [x] Both frontends use the same API contract and do not independently own database history.
- [x] User activity remains behind authenticated API routes; its browser-readable table has RLS for owner-only reads.
- [x] Backend sessions store edition, client runtime, and browser core/system metadata with constrained values.
- [x] Production, preview, and local origins remain explicit in API CORS settings.
- [x] Every play attempt has a stable event ID, making retries idempotent while preserving edition-aware recent activity.

### 5.3 Frontend architecture

- [x] Remove Studio-only engine monitors and desktop pairing from the User Edition app shell.
- [x] Remove Engine Connection and native multiplayer routes; present the browser-only local picker as Personal ROMs and keep stream telemetry out of User navigation.
- [x] Keep catalog/community code local until the WASM path stabilizes instead of prematurely creating shared packages.
- [x] Add an emulator-core registry so compatibility and runtime selection are configuration-driven.
- [x] Load the selected runtime and Nostalgist package only after a user starts a compatible game.

### 5.4 Security and deployment headers

- [x] Keep all `.env` files ignored and provide sanitized `.env.example` files.
- [x] Document credential rotation; deleting Git history does not revoke a leaked credential.
- [x] Add a restrictive Content Security Policy covering the shared API, Supabase, signed artifacts, Turnstile, the core CDN, WASM compilation, and workers.
- [x] Leave COOP/COEP disabled because the selected core does not require `SharedArrayBuffer`; document the compatibility gate for enabling them later.
- [x] Pin Nostalgist exactly, retain its lockfile integrity hash, and monitor frontend runtime updates with Dependabot.
- [x] Require hosted ROM evidence, verify header/size/SHA-256 before execution, stream into bounded memory, and enforce a launch deadline.

### 5.5 Publishing and administration

- [x] Keep publishing and administration out of the User Edition route and API bundles.
- [x] Require system/runtime compatibility in the Studio Edition review flow.
- [x] Store verified checksum and size at approval time in the shared backend.
- [x] Run the User Edition browser-play smoke test from Studio administration.
- [x] Show Studio reviewers why a submission is not browser-compatible.
- [x] Keep legal availability separate from technical compatibility.

### 5.6 PWA and offline support

- [x] Cache only the application shell, same-origin build assets, and the pinned emulator-core CDN; never cache authenticated API responses or ROM requests.
- [x] Keep personal ROM bytes memory-only instead of persisting large artifacts without consent.
- [x] Version browser saves and PWA/core caches so upgrades can clean up safely.
- [x] Provide a device-storage screen for usage, persistence requests, cache clearing, saves, and local-file history.

## 6. Not possible in a pure hosted browser (do not plan for v1)

- Automatic LAN discovery or scanning arbitrary devices on a user's network.
- Opening a general-purpose inbound server or accepting raw LAN connections.
- Direct filesystem browsing without a user-mediated picker or previously granted handle.
- Launching arbitrary native executables, Docker containers, or desktop emulator cores.
- Reliable background execution after the tab is suspended or closed.
- Unrestricted raw USB/Bluetooth access across browsers.
- Guaranteed persistent storage: browsers may evict site data unless platform-specific persistence is granted.
- Transparent access to Studio Edition's local engine without a separately installed companion app and an explicit secure pairing flow.

These are platform boundaries, not missing implementation tasks. Keep them in Studio Edition or behind an optional installed companion.

## 7. V1 non-goals

- Supporting every console/core.
- LAN sharing and native-engine pairing.
- Internet netplay.
- Perfect mobile support.
- Syncing personal ROMs to the server.
- Reproducing every Studio telemetry panel.
- Offline installation of the whole catalog.

## 8. Delivery phases

### Phase 0 — repository and security baseline

1. Confirm ignored env/build/dependency paths.
2. Rotate leaked credentials and update deployment secret stores.
3. Establish `apps/web` and `services/api` as the canonical paths.
4. Make build, lint, and tests green before feature work.

### Phase 1 — NES vertical slice

1. Ship section 4.1 behind a feature flag or limited catalog eligibility.
2. Configure artifact CORS and short-lived URLs.
3. Test one known-good public-domain/homebrew NES title end to end.
4. Capture startup timing and errors.

### Phase 2 — production hardening

1. Test the browser matrix and low-memory devices.
2. Add CSP, rate-limit validation, monitoring, and accessible error recovery.
3. Confirm session cleanup, play counting, and storage behavior.
4. Audit licenses for emulator code, cores, and hosted game artifacts.

### Phase 3 — personal ROM and saves

1. Add local file launch.
2. Add IndexedDB saves and export/import.
3. Add control mapping and touch UI.

### Phase 4 — more systems

1. Build a core/extension capability registry.
2. Add one system at a time with fixtures and browser measurements.
3. Keep unsupported catalog games on the Studio path.

## 9. Initial issue backlog

- WASM-001: browser runtime interface and state machine.
- WASM-002: Nostalgist NES adapter and lazy chunk.
- WASM-003: ROM streaming, size cap, header, and checksum validation.
- WASM-004: WASM player stage and controls.
- WASM-005: browser boot metadata and signed artifact URL.
- WASM-006: browser eligibility badges and filters.
- WASM-007: browser compatibility test matrix.
- WASM-008: startup performance instrumentation.
- WASM-009: CSP/CORS and deployment hardening.
- WASM-010: IndexedDB saves and migration format.
- WASM-011: local ROM picker and privacy messaging.
- WASM-012: remove remaining Studio-only shell behavior.

## 10. Definition of done for the first WASM release

- An authenticated user can launch an approved NES title without the desktop engine.
- The ROM is delivered through an expiring URL and passes size/header/checksum validation.
- Emulator code is lazy-loaded and the normal catalog bundle remains usable without it.
- Start, pause, resume, reset, stop, mute, volume, fullscreen, keyboard, and a standard gamepad work.
- Failed downloads, unsupported games, browser limitations, and audio blocking have actionable UI.
- Sessions clean up on stop, retry, navigation, and unmount.
- Play counting begins only after the runtime reaches playing state.
- Tests, lint, production build, security review, and browser smoke tests pass.
- No secrets, ROMs, dependency directories, or build outputs are candidates for commit.
