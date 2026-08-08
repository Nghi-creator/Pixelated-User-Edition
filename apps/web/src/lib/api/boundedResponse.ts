export const MAX_BROWSER_ARTIFACT_BYTES = 64 * 1024 * 1024;

function requireSafeExpectedSize(expectedSize: number, maxBytes: number) {
  if (!Number.isSafeInteger(expectedSize) || expectedSize <= 0) {
    throw new Error("The artifact has an invalid expected size.");
  }
  if (expectedSize > maxBytes) {
    throw new Error(
      `The artifact exceeds the ${Math.floor(maxBytes / 1024 / 1024)} MB browser safety limit.`,
    );
  }
}

export async function readBoundedResponseBlob(
  response: Response,
  expectedSize: number,
  maxBytes = MAX_BROWSER_ARTIFACT_BYTES,
) {
  requireSafeExpectedSize(expectedSize, maxBytes);

  const contentLengthValue = response.headers.get("content-length");
  if (contentLengthValue) {
    const contentLength = Number(contentLengthValue);
    if (!Number.isSafeInteger(contentLength) || contentLength !== expectedSize) {
      throw new Error(
        `Artifact size mismatch: expected ${expectedSize} bytes, received ${contentLengthValue}.`,
      );
    }
  }

  if (!response.body) {
    throw new Error("The browser cannot safely stream this artifact response.");
  }

  const reader = response.body.getReader();
  const bytes = new Uint8Array(expectedSize);
  let loadedBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const nextLoadedBytes = loadedBytes + value.byteLength;
      if (nextLoadedBytes > expectedSize || nextLoadedBytes > maxBytes) {
        throw new Error(
          `Artifact size mismatch: expected ${expectedSize} bytes, received more data.`,
        );
      }
      bytes.set(value, loadedBytes);
      loadedBytes = nextLoadedBytes;
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  }

  if (loadedBytes !== expectedSize) {
    throw new Error(
      `Artifact size mismatch: expected ${expectedSize} bytes, received ${loadedBytes}.`,
    );
  }

  return new Blob([bytes], { type: "application/octet-stream" });
}
