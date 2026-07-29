<img src="assets/banner.png" alt="PIXELATED User Edition" width="100%" />

# PIXELATED User Edition

[![License: MIT](https://img.shields.io/badge/License-MIT-f06292.svg)](LICENSE)
[![Live app](https://img.shields.io/badge/Live-pixelated--user--edition.vercel.app-c2185b)](https://pixelated-user-edition.vercel.app/)
[![Creator](https://img.shields.io/badge/Creator-Nghi--creator-ff6f61)](https://github.com/Nghi-creator)

PIXELATED User Edition is the browser-native edition of PIXELATED. It runs
supported retro games directly in the current tab through WebAssembly, with no
desktop engine, Docker container, or WebRTC stream required.

It shares accounts, catalog data, favorites, comments, reactions, and other
community state with
[PIXELATED Studio Edition](https://github.com/Nghi-creator/Pixelated-Studio-Edition),
while keeping the gameplay runtime deliberately separate.

> [!IMPORTANT]
> PIXELATED celebrates homebrew and independently published games. Game files,
> artwork, emulator cores, and other third-party material remain subject to
> their respective authors' licenses. Only use personal ROM files that you are
> legally permitted to use.

## Try it

Open the deployed app at
[pixelated-user-edition.vercel.app](https://pixelated-user-edition.vercel.app/).

You can browse the shared catalog or open a supported personal ROM locally.
Personal ROM bytes are kept in memory and are never uploaded by the User
Edition.

## What is included

| Area | Current capabilities |
| --- | --- |
| Browser gameplay | Lazy-loaded Libretro WebAssembly cores, download and verification progress, pause/resume, reset, stop, volume, mute, fullscreen, and pixel rendering |
| Catalog | Search, pagination, browser-availability, system, genre, and license filters, artwork, author and license information, and runtime eligibility badges |
| Accounts and community | Supabase authentication, profiles, avatars, favorites, likes/dislikes, comments, reactions, reports, and shared play activity |
| Personal ROMs | Drag-and-drop or file selection, format/header validation, in-memory playback, and a metadata-only recent-files list |
| Input | Remappable keyboard controls, per-controller gamepad mappings, conflict detection, and touch-control presets |
| Local saves | Three versioned save-state slots per game, plus import, export, overwrite, load, and delete controls stored in IndexedDB |
| PWA and storage | Installable app shell, offline caching for static runtime assets, storage usage, persistence requests, and local-data cleanup |
| Research tools | Explicitly opt-in local browser measurements and exportable research bundles |

## Supported systems

| System | Extensions | Core | Status |
| --- | --- | --- | --- |
| Nintendo Entertainment System | `.nes` | FCEUmm | Playable |
| Game Boy | `.gb` | Gambatte | Playable |
| Game Boy Color | `.gbc` | Gambatte | Playable |

Game Boy Advance, Super Nintendo, Genesis / Mega Drive, Master System, and Game
Gear files can be identified by the Local Vault, but they are not playable
until compatible browser cores are added.

The emulator builds are pinned and served from the same origin. Their source
and checksums are documented in
[`apps/web/public/emulator-cores/README.md`](apps/web/public/emulator-cores/README.md).

## User Edition and Studio Edition

The two editions are alternative clients for the same PIXELATED ecosystem:

| User Edition | Studio Edition |
| --- | --- |
| Runs supported games locally in the browser with WebAssembly | Runs games in a native Linux engine and streams them with WebRTC |
| Requires no paired desktop engine | Uses the Electron desktop orchestrator and containerized runtime |
| Focuses on solo browser play and local tools | Supports the streaming, lobby, multiplayer, publishing, and administration workflows |
| Keeps personal ROM bytes in the current browser session | Can use native runtime capabilities unavailable to a browser |

This repository intentionally contains the User Edition frontend only. The
shared API and Supabase migrations are owned and deployed from the Studio
Edition repository so that there is one backend contract and one migration
authority.

## Runtime flow

For a catalog game:

1. The browser requests a gameplay session from the shared API.
2. The API checks browser eligibility and returns a short-lived artifact URL.
3. The client downloads the ROM with a strict size limit and verifies its
   format and SHA-256 digest.
4. The matching pinned WebAssembly core is loaded on demand.
5. The game runs locally in the tab; controls, measurements, and save states
   remain browser-side.

For a personal ROM, the file is read directly from the browser file picker.
Only filename, size, detected system, and last-opened time may be saved in the
recent-files list. Refreshing or closing the page removes the playable ROM
bytes from memory, so the original file must be selected again.

## Project structure

```text
Pixelated-User-Edition/
├── apps/
│   └── web/                 # React, TypeScript, and Vite application
├── assets/                  # Repository artwork
├── docs/
│   ├── WASM_BUILD_PLAN.md   # Implementation record and roadmap
│   └── WASM_SECURITY.md     # Browser runtime security model
├── LICENSE
└── README.md
```

Important browser routes:

| Route | Purpose |
| --- | --- |
| `/` | Product landing page |
| `/home` | Shared game catalog |
| `/play/:id` | Catalog gameplay |
| `/local` | Personal ROM picker and local gameplay |
| `/storage` | Browser storage management |
| `/favorites` | Signed-in user's saved games |
| `/profile` | Account and profile settings |

## Local development

Prerequisites:

- A current Node.js LTS release and npm
- Access to a compatible PIXELATED API and Supabase project

```bash
cd apps/web
npm install
cp .env.example .env.local
npm run dev
```

The local app is served by Vite, normally at `http://localhost:5173`.

Configure these public browser variables in `apps/web/.env.local`:

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-key
VITE_PUBLIC_APP_URL=http://localhost:5173
VITE_API_URL=http://127.0.0.1:4000
VITE_TURNSTILE_SITE_KEY=
```

All `VITE_*` values are bundled into client code. Never place a Supabase secret
or service-role key, database password, Redis token, or other server credential
in this file.

Useful checks:

```bash
cd apps/web
npm run lint
npm test
npm run build
```

## Deployment

The production frontend is a Vite single-page application deployed on Vercel.
For a monorepo import, use:

- **Root Directory:** `apps/web`
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

Set the five public environment variables above for the intended deployment
environment. The Supabase project used by the frontend must match the project
used by its configured API.

The deployment also applies the security headers and SPA rewrite defined in
[`apps/web/vercel.json`](apps/web/vercel.json).

## Privacy and security

- Personal ROM bytes are never sent to the PIXELATED API.
- Catalog artifacts use short-lived URLs and are validated before launch.
- Browser downloads are bounded to protect memory.
- Emulator cores are version-pinned instead of loaded from an arbitrary CDN at
  runtime.
- Save states, mappings, recent-file metadata, and optional measurements stay
  in browser storage unless the user explicitly exports them.
- The PWA caches the application shell and pinned runtime assets, not API,
  authentication, or ROM responses.

See [`docs/WASM_SECURITY.md`](docs/WASM_SECURITY.md) for the complete browser
threat model and [`docs/WASM_BUILD_PLAN.md`](docs/WASM_BUILD_PLAN.md) for the
implementation history and deferred work.

## Current boundaries

- Browser play currently supports NES, Game Boy, and Game Boy Color.
- Personal ROM persistence is intentionally opt-in/deferred; ROM bytes are
  memory-only today.
- Native executables, Studio publishing and administration, WebRTC streaming,
  LAN pairing, and multiplayer are outside the User Edition.
- Browser storage can still be cleared by the browser or operating system, so
  important save states should be exported.

## Community

- [Report a bug or request a feature](https://github.com/Nghi-creator/Pixelated-User-Edition/issues)
- [PIXELATED Studio Edition](https://github.com/Nghi-creator/Pixelated-Studio-Edition)
- [Creator profile](https://github.com/Nghi-creator)

## License

The original PIXELATED User Edition source code is licensed under the
[MIT License](LICENSE).

This license does not relicense emulator cores, games, artwork, fonts, or other
third-party materials. Those components retain their own licenses and notices.
