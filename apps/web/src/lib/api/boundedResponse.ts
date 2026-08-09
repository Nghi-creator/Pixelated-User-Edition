export const MAX_BROWSER_ARTIFACT_BYTES = 64 * 1024 * 1024;
export const MAX_API_JSON_BYTES = 2 * 1024 * 1024;

function requireSafeMaximum(maxBytes: number) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) {
    throw new Error("The response has an invalid browser safety limit.");
  }
}

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

export async function readBoundedResponseText(response: Response, maxBytes = MAX_API_JSON_BYTES) {
  requireSafeMaximum(maxBytes);

  const contentLengthValue = response.headers.get("content-length");
  if (contentLengthValue) {
    const contentLength = Number(contentLengthValue);
    if (!Number.isSafeInteger(contentLength) || contentLength < 0) {
      throw new Error("The API returned an invalid response size.");
    }
    if (contentLength > maxBytes) {
      throw new Error(
        `The API response exceeds the ${Math.ceil(maxBytes / 1024 / 1024)} MB browser safety limit.`,
      );
    }
  }

  if (!response.body) {
    throw new Error("The browser cannot safely stream this API response.");
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let loadedBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      loadedBytes += value.byteLength;
      if (loadedBytes > maxBytes) {
        throw new Error(
          `The API response exceeds the ${Math.ceil(maxBytes / 1024 / 1024)} MB browser safety limit.`,
        );
      }
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  }

  const bytes = new Uint8Array(loadedBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}
