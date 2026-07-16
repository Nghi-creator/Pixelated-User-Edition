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
- [x] Give unsupported systems a clear NES-only error instead of attempting a broken launch.
- [ ] Test the supported browser matrix on current Chrome, Edge, Firefox, and Safari.
- [ ] Measure first-play download, startup time, memory use, and bundle-cache behavior.

### 4.2 Catalog and discovery

- [x] Browse, server-ranked search, pagination, artwork, rights, author, and license links.
- [x] Favorites and profile-linked library state.
- [x] Eligibility badges: “Play in browser,” “Desktop required,” and “Currently unavailable.”
- [x] Correct server-side filters for system and runtime availability, including filtered pagination totals and cache keys.
- [x] Friendly pre-launch unavailable-artifact, native-runtime, and unsupported-system states.
- [x] Tested compatibility policy based on enabled build, runtime kind, platform, extension, size, and checksum metadata.
- [ ] Genre filter after genre metadata is added to the shared catalog schema.
- [ ] License filter/facets after the API exposes normalized per-game license metadata for catalog queries.

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

### 4.5 Saves and usability

- [x] Three versioned, per-game save-state slots are stored in a dedicated IndexedDB database.
- [x] Save states can be imported, exported, loaded, overwritten, and deleted with size/type validation.
- [x] Battery RAM can be backed up as an export. Restore remains pending because Nostalgist 0.21 exposes no supported SRAM-load API.
- [x] Per-game touch A/B layout remapping and compact, large-target, and high-contrast accessibility presets.
- [x] Pointer-safe touch controls for mobile-sized screens, including D-pad, A/B, Start, and Select.
- Keyboard/gamepad remapping remains pending; it needs a pre-launch RetroArch configuration flow and conflict validation.
- PWA shell and offline replay for assets the user is legally allowed to cache.
- [x] Browser storage quota/usage checks and recovery/export instructions.

### 4.6 Research measurements that fit the browser

- [x] ROM download, verification, emulator-core load, and launch-to-first-browser-frame timings.
- [x] Animation-frame pacing, dropped-frame estimates, long tasks, supported JS heap estimates, and runtime errors.
- [x] Browser/OS capability snapshot is captured only after explicit informed consent.
- [x] Exportable TAR bundle with User Edition/WASM metadata, summary JSON, frame/long-task CSV files, and runtime errors.

## 5. Features that require changes

### 5.1 Backend and artifact delivery

- Return `runtimeKind`, ROM filename, byte size, SHA-256, and a short-lived browser-readable artifact URL from the boot contract.
- Configure artifact CORS for the deployed User Edition origins.
- Prefer signed, expiring URLs; never expose storage service credentials.
- Add browser eligibility metadata per artifact/core/system.
- Rate-limit session creation and artifact URL issuance.
- Decide whether anonymous demo sessions are allowed. The current implementation expects authentication.

### 5.2 Shared API and database

- Apply schema migrations from one authoritative location.
- Treat both frontends as clients of the same API contract, not independent owners of the database.
- Keep RLS enabled for browser-accessible tables and test every policy for both editions.
- Add `client_edition`, `runtime_kind`, and browser-session metadata only where useful.
- Keep production, preview, and local origins explicit in API CORS settings.
- Avoid double-counting sessions or play events when a user retries a launch.

### 5.3 Frontend architecture

- Remove Studio-only engine monitors and desktop pairing from the User Edition app shell.
- Replace or hide Engine Connection, Local Vault, native multiplayer, and stream telemetry navigation.
- Split reusable catalog/community code into shared packages only after the WASM path stabilizes.
- Add an emulator-core registry so future systems are configuration-driven.
- Keep runtime packages lazy so catalog visitors do not download emulator code.

### 5.4 Security and deployment headers

- Keep all `.env` files ignored and provide sanitized `.env.example` files.
- Rotate any credential ever committed or shown publicly; deleting Git history does not revoke it.
- Add a restrictive Content Security Policy covering API, Supabase, artifacts, and WASM workers.
- Add COOP/COEP only if a selected core needs `SharedArrayBuffer`; verify the effect on auth and third-party embeds first.
- Pin emulator/core versions and monitor their supply chain.
- Verify ROM checksum before execution and cap size, time, and memory exposure.

### 5.5 Publishing and administration

- Require system/runtime compatibility during review.
- Store verified checksum and size at approval time.
- Add a browser-play smoke test to the moderation flow.
- Show why a submission is not browser-compatible.
- Separate legal availability from technical compatibility.

### 5.6 PWA and offline support

- Design explicit cache rules; never cache authenticated API responses indiscriminately.
- Obtain user consent before persisting large ROM artifacts.
- Version saves and emulator cores so upgrades can migrate safely.
- Provide a “clear downloaded games and saves” storage screen.

### 5.7 Multiplayer

- Local same-device multiplayer is possible when the emulator/core supports multiple controllers.
- Internet multiplayer needs a purpose-built netplay protocol, synchronization, signaling, relay strategy, latency handling, and abuse controls.
- The existing WebRTC video-stream architecture cannot simply be copied into a peer-to-peer deterministic emulator.

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

### Phase 5 — optional multiplayer research

1. Prototype same-device multiplayer first.
2. Research deterministic netplay separately from streaming.
3. Do not promise LAN discovery from the hosted web app.

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
