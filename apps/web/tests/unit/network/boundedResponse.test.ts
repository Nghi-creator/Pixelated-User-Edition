import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_BROWSER_ARTIFACT_BYTES,
  readBoundedResponseBlob,
} from "../../../src/lib/api/boundedResponse.ts";

test("bounded response reader accepts an exact streamed artifact", async () => {
  const response = new Response(new Uint8Array([1, 2, 3, 4]), {
    headers: { "content-length": "4" },
  });

  const blob = await readBoundedResponseBlob(response, 4);

  assert.deepEqual(new Uint8Array(await blob.arrayBuffer()), new Uint8Array([1, 2, 3, 4]));
});

test("bounded response reader rejects unsafe metadata before allocating", async () => {
  const response = new Response(new Uint8Array([1]));

  await assert.rejects(
    readBoundedResponseBlob(response, MAX_BROWSER_ARTIFACT_BYTES + 1),
    /safety limit/,
  );
  await assert.rejects(readBoundedResponseBlob(response, -1), /invalid expected size/);
});

test("bounded response reader rejects oversized and truncated streams", async () => {
  await assert.rejects(
    readBoundedResponseBlob(new Response(new Uint8Array([1, 2, 3])), 2),
    /received more data/,
  );
  await assert.rejects(
    readBoundedResponseBlob(new Response(new Uint8Array([1, 2])), 3),
    /received 2/,
  );
});

test("bounded response reader rejects a mismatched content length immediately", async () => {
  const response = new Response(new Uint8Array([1, 2]), {
    headers: { "content-length": "20" },
  });

  await assert.rejects(readBoundedResponseBlob(response, 2), /size mismatch/);
});
