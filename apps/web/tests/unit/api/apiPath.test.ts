import assert from "node:assert/strict";
import test from "node:test";
import { encodeApiPathSegment } from "../../../src/lib/api/apiPath.ts";

test("API path segments cannot alter routing or query strings", () => {
  assert.equal(
    encodeApiPathSegment("../games/other?id=admin"),
    "..%2Fgames%2Fother%3Fid%3Dadmin",
  );
});
