const NES_HEADER = [0x4e, 0x45, 0x53, 0x1a] as const;

export const MAX_NES_ROM_BYTES = 64 * 1024 * 1024;

export function assertNesRom(bytes: Uint8Array) {
  if (bytes.byteLength < 16) {
    throw new Error("The downloaded game is too small to be a valid NES ROM.");
  }
  if (!NES_HEADER.every((value, index) => bytes[index] === value)) {
    throw new Error("The downloaded file does not have a valid NES ROM header.");
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
  if (bytes.byteLength > MAX_NES_ROM_BYTES) {
    throw new Error("The game is larger than the 64 MB browser safety limit.");
  }
  if (expectedSize && bytes.byteLength !== expectedSize) {
    throw new Error(
      `ROM size mismatch: expected ${expectedSize} bytes, received ${bytes.byteLength}.`,
    );
  }
  assertNesRom(bytes);
  const checksum = normalizeSha256(expectedSha256);
  if (checksum && (await sha256Hex(bytes)) !== checksum) {
    throw new Error("ROM checksum verification failed. The download may be corrupted.");
  }
}

