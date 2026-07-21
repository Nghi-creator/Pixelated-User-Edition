# Pixelated Web

Vite React frontend for PIXELATED Studio. The web app owns the user experience, browser orchestration, engine pairing UI, gameplay receiver, social surfaces, publishing flow, and admin tools.

## Main routes

| Route | Purpose |
| --- | --- |
| `/` | Product introduction and download/entry links. |
| `/home` | Cloud catalog, featured games, search, pagination, and game cards. |
| `/engine` | Desktop engine pairing, launch-ticket redemption, and LAN invite pairing. |
| `/play/:id` | Gameplay screen, WebRTC stream, input forwarding, social panels, and stream telemetry. |
| `/local` | Memory-only personal ROM picker and browser WASM player. |
| `/storage` | Browser storage usage, persistence, cache, saves, and local history controls. |
| `/multiplayer` | LAN host/guest setup, invite links, lobby state, and game selection. |
| `/favorites` | Signed-in user's saved games. |
| `/publish` | Creator game submission and rights questionnaire. |
| `/profile` | Profile, avatar, password, and account controls. |
| `/admin/*` | Admin dashboard, users, access logs, submissions, and catalog candidates. |

## Code map

```text
src/pages/              Route-level screens
src/components/         Shared UI and layout pieces
src/features/           Feature-owned browser state and components
src/lib/api/            Hosted API client, queries, mutations, and types
src/lib/auth/           Supabase auth/session helpers
src/lib/engine/         Engine pairing, local credentials, launch restore
src/lib/webrtc/         WebRTC session, signaling, input, telemetry, recovery
tests/unit/             Node test runner unit coverage by domain
tests/interaction/      Browser interaction harness
```

The browser should use `src/lib/api/*` for app data owned by `services/api`. Direct Supabase browser use is intentionally limited to auth/session handling and Storage uploads for signed-in submission workflows.

WASM keyboard mappings and per-controller gamepad profiles are configured from the player before launch and stored locally in the browser. The custom input layer disables Nostalgist's global input listener so remapped and default controls cannot fire twice.

## Local development

```sh
npm install
npm run dev
```

Default dev URL:

```text
http://localhost:5173
```

## Verification

```sh
npm run lint
npm test
npm run build
```

The root hosted-contract gate also runs web lint, tests, build, interaction harness, smoke scripts, and desktop tests:

```sh
npm run verify:hosted-contract
```

## Environment variables

```txt
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_PUBLIC_APP_URL=https://pixelated-studio-edition.vercel.app
VITE_API_URL=https://pixelated-api-services-6ovi.onrender.com
VITE_ENGINE_URL=http://localhost:8080
VITE_TURNSTILE_SITE_KEY=
```

Set `VITE_PUBLIC_APP_URL` in Vercel and in Supabase Auth redirect settings so verification, recovery, and OAuth callbacks do not fall back to localhost.

Set `VITE_TURNSTILE_SITE_KEY` only after enabling Cloudflare Turnstile CAPTCHA in Supabase Auth with the matching secret key. When configured, the auth page sends CAPTCHA tokens with email/password sign-in, signup confirmation, confirmation resend, and password recovery requests.

## PWA and offline behavior

Production builds register `public/sw.js` and can be installed as Pixelated User Edition.
The service worker caches only the application shell, same-origin hashed assets, and the exact
pinned FCEUmm/ZIP runtime artifacts. API responses, authenticated requests, Supabase traffic,
and ROM downloads are never cached. Personal ROM bytes remain memory-only.

When the app shell changes or the pinned emulator core is upgraded, bump `CACHE_VERSION` in
`public/sw.js`; activation removes older Pixelated caches. Users can inspect usage, request
persistent save storage, and clear caches or local saves at `/storage`.

Recommended Supabase Authentication URL Configuration:

```txt
Site URL: https://pixelated-studio-edition.vercel.app
Redirect URLs: https://pixelated-studio-edition.vercel.app/**
```

Signup confirmation and recovery links expire after 5 minutes. Unconfirmed accounts older than 72 hours are removed by `20260611153000_cleanup_stale_unconfirmed_users.sql`.

## Vercel deployment

Configure the Vercel project root directory as:

```text
apps/web
```

`apps/web/vercel.json` rewrites direct requests such as `/admin`, `/engine`, and `/play/:id` to the React entry point so refreshes work with `BrowserRouter`.

## Engine expectations

Routes that boot or manage local gameplay require an engine connection:

- `/play/:id`
- `/local`
- `/multiplayer`

The connection may be a raw local engine token for localhost use or a `companion:<credential>` token from the desktop HTTPS companion. Companion credentials are scoped and revocable, and transient companion probe failures should not erase saved pairing.
