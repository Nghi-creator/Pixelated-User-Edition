# User Edition WASM security baseline

## Deployment boundary

- Vercel serves the User Edition frontend with the policy in `apps/web/vercel.json`.
- The Content Security Policy allows only the shared API, Supabase API/Storage,
  Cloudflare Turnstile, Google Fonts, and the pinned Nostalgist core CDN.
- `worker-src` permits same-origin, blob, and jsDelivr workers required by the
  emulator toolchain. `script-src` permits WebAssembly compilation explicitly.
- COOP and COEP are intentionally disabled. Enable them only if a selected core
  requires `SharedArrayBuffer`, after testing Supabase authentication, Turnstile,
  signed ROM downloads, and every supported browser.

## Secrets

- All `.env` and `.env.*` files are ignored recursively; only `.env.example`
  files may be committed.
- Browser variables are public configuration. Never place a Supabase secret key,
  Redis token, database password, or service-role credential in a `VITE_*` value.
- Revoke and replace any credential committed or displayed publicly. Removing it
  from Git history does not revoke it.

## Emulator upgrades

`nostalgist` is pinned exactly in `apps/web/package.json`, with its tarball hash
locked by `package-lock.json`. Dependabot may propose updates, but do not merge an
emulator/core update until all of the following pass:

1. Review the upstream release and transitive dependency changes.
2. Run lint, unit tests, and the production build.
3. Launch a known checksum-pinned catalog ROM and a local NES ROM.
4. Verify pause, reset, state import/export, and battery-save export.
5. Confirm CSP produces no violations and the emulator remains a lazy chunk.
6. Repeat the supported Chrome, Edge, Firefox, and Safari smoke matrix.

## ROM execution limits

- Hosted ROMs require an expected byte size and SHA-256 checksum.
- Downloads stream into a fixed-size buffer and are rejected if the declared or
  received size exceeds 64 MiB.
- ROM download, verification, core loading, and emulator preparation share a
  bounded launch deadline.
- The NES header, exact byte size, and SHA-256 digest are verified before core
  execution.
