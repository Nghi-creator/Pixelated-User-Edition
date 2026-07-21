const NES_HEADER = [0x4e, 0x45, 0x53, 0x1a] as const;
const GAME_BOY_LOGO = [
  0xce, 0xed, 0x66, 0x66, 0xcc, 0x0d, 0x00, 0x0b,
  0x03, 0x73, 0x00, 0x83, 0x00, 0x0c, 0x00, 0x0d,
  0x00, 0x08, 0x11, 0x1f, 0x88, 0x89, 0x00, 0x0e,
  0xdc, 0xcc, 0x6e, 0xe6, 0xdd, 0xdd, 0xd9, 0x99,
  0xbb, 0xbb, 0x67, 0x63, 0x6e, 0x0e, 0xec, 0xcc,
  0xdd, 0xdc, 0x99, 0x9f, 0xbb, 0xb9, 0x33, 0x3e,
] as const;

export const MAX_BROWSER_ROM_BYTES = 64 * 1024 * 1024;
export const MAX_NES_ROM_BYTES = MAX_BROWSER_ROM_BYTES;
export type BrowserRomSystemId = "nes" | "gb" | "gbc";

export function normalizeExpectedRomSize(
  value: number | null | undefined,
) {
  if (value === null || value === undefined) return null;
  if (!Number.isSafeInteger(value) || value < 16 || value > MAX_BROWSER_ROM_BYTES) {
    throw new Error("The catalog supplied an invalid ROM byte size.");
  }
  return value;
}

export function assertNesRom(bytes: Uint8Array) {
  if (bytes.byteLength < 16) {
    throw new Error("The downloaded game is too small to be a valid NES ROM.");
  }
  if (!NES_HEADER.every((value, index) => bytes[index] === value)) {
    throw new Error("The downloaded file does not have a valid NES ROM header.");
  }
}

export function assertGameBoyRom(bytes: Uint8Array) {
  if (bytes.byteLength < 0x150) {
    throw new Error("The downloaded game is too small to be a valid Game Boy ROM.");
  }
  if (!GAME_BOY_LOGO.every((value, index) => bytes[0x104 + index] === value)) {
    throw new Error("The downloaded file does not have a valid Game Boy ROM header.");
  }
}

export function normalizeSha256(value: string | null | undefined) {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(normalized)) {
    throw new Error("The catalog supplied an invalid ROM checksum.");
  }
  return normalized;
}

export function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

export async function sha256Hex(bytes: Uint8Array) {
  const digestBytes = Uint8Array.from(bytes);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", digestBytes.buffer);
  return bytesToHex(new Uint8Array(digest));
}

export async function validateNesRom(
  bytes: Uint8Array,
  {
    expectedSha256,
    expectedSize,
  }: { expectedSha256?: string | null; expectedSize?: number | null } = {},
) {
  if (bytes.byteLength > MAX_BROWSER_ROM_BYTES) {
    throw new Error("The game is larger than the 64 MB browser safety limit.");
  }
  const normalizedExpectedSize = normalizeExpectedRomSize(expectedSize);
  if (normalizedExpectedSize !== null && bytes.byteLength !== normalizedExpectedSize) {
    throw new Error(
      `ROM size mismatch: expected ${normalizedExpectedSize} bytes, received ${bytes.byteLength}.`,
    );
  }
  assertNesRom(bytes);
  const checksum = normalizeSha256(expectedSha256);
  if (checksum && (await sha256Hex(bytes)) !== checksum) {
    throw new Error("ROM checksum verification failed. The download may be corrupted.");
  }
}

export async function validateBrowserRom(
  systemId: BrowserRomSystemId,
  bytes: Uint8Array,
  expected: { expectedSha256?: string | null; expectedSize?: number | null } = {},
) {
  if (systemId === "nes") return validateNesRom(bytes, expected);
  if (bytes.byteLength > MAX_BROWSER_ROM_BYTES) {
    throw new Error("The game is larger than the 64 MB browser safety limit.");
  }
  const normalizedExpectedSize = normalizeExpectedRomSize(expected.expectedSize);
  if (normalizedExpectedSize !== null && bytes.byteLength !== normalizedExpectedSize) {
    throw new Error(
      `ROM size mismatch: expected ${normalizedExpectedSize} bytes, received ${bytes.byteLength}.`,
    );
  }
  assertGameBoyRom(bytes);
  const checksum = normalizeSha256(expected.expectedSha256);
  if (checksum && (await sha256Hex(bytes)) !== checksum) {
    throw new Error("ROM checksum verification failed. The download may be corrupted.");
  }
}
