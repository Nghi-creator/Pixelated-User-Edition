# PIXELATED User Edition Web

This directory contains the React, TypeScript, and Vite frontend for PIXELATED
User Edition. Supported games run directly in the browser through pinned
Libretro WebAssembly cores; this app does not connect to the Studio desktop
engine or create WebRTC streams.

For the product overview, architecture boundary, supported systems, privacy
model, and deployment instructions, see the
[repository README](../../README.md).

## Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Vite normally serves the app at `http://localhost:5173`.

## Public environment variables

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-key
VITE_PUBLIC_APP_URL=http://localhost:5173
VITE_API_URL=http://127.0.0.1:4000
VITE_TURNSTILE_SITE_KEY=
```

These variables are embedded into the browser bundle. Do not use secret or
service-role credentials in any `VITE_*` value.

The Supabase project and API must belong to the same PIXELATED environment.
The shared API and database migrations are maintained in the Studio Edition
repository rather than this repository.

## Commands

```bash
npm run dev
npm run format
npm run lint
npm test
npm run test:e2e
npm run build
npm run preview
```

Run `npx playwright install chromium` once before the browser smoke suite on a
new development or CI machine.

## Main routes

| Route                     | Purpose                             |
| ------------------------- | ----------------------------------- |
| `/`                       | Landing page                        |
| `/home`                   | Catalog                             |
| `/play/:id`               | WebAssembly catalog gameplay        |
| `/local`                  | Personal ROMs and local gameplay    |
| `/storage`                | Browser storage management          |
| `/favorites`              | Favorites                           |
| `/profile`                | Account settings                    |
| `/internal/browser-smoke` | Internal browser-runtime smoke test |

## Runtime assets

Pinned FCEUmm and Gambatte builds live under `public/emulator-cores`. See
[`public/emulator-cores/README.md`](public/emulator-cores/README.md) for their
upstream source, versions, and checksums.

The production SPA and security headers are configured in `vercel.json`.
