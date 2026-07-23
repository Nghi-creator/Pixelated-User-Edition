import assert from "node:assert/strict";
import test from "node:test";
import { NostalgistWasmRuntime } from "../../../src/lib/runtime/wasm/NostalgistWasmRuntime.ts";
import { sha256Hex } from "../../../src/lib/runtime/wasm/romValidation.ts";

function validNesRom() {
  const bytes = new Uint8Array(32);
  bytes.set([0x4e, 0x45, 0x53, 0x1a]);
  return bytes;
}

function validGameBoyRom() {
  const bytes = new Uint8Array(0x150);
  bytes.set([
    0xce, 0xed, 0x66, 0x66, 0xcc, 0x0d, 0x00, 0x0b,
    0x03, 0x73, 0x00, 0x83, 0x00, 0x0c, 0x00, 0x0d,
    0x00, 0x08, 0x11, 0x1f, 0x88, 0x89, 0x00, 0x0e,
    0xdc, 0xcc, 0x6e, 0xe6, 0xdd, 0xdd, 0xd9, 0x99,
    0xbb, 0xbb, 0x67, 0x63, 0x6e, 0x0e, 0xec, 0xcc,
    0xdd, 0xdc, 0x99, 0x9f, 0xbb, 0xb9, 0x33, 0x3e,
  ], 0x104);
  return bytes;
}

test("prepares the fceumm core and exposes runtime controls", async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async () => new Response(validNesRom());

  const actions: string[] = [];
  let status: "initial" | "running" | "paused" | "terminated" = "initial";
  const runtime = new NostalgistWasmRuntime({
    canvas: {} as HTMLCanvasElement,
    loadNostalgist: async () => ({
      Nostalgist: {
        async prepare(options) {
          assert.equal(options.core, "fceumm");
          assert.equal(options.respondToGlobalEvents, false);
          return {
            exit: () => { status = "terminated"; actions.push("exit"); },
            getStatus: () => status,
            loadState: async () => { actions.push("load-state"); },
            pause: () => { status = "paused"; actions.push("pause"); },
            pressDown: (button: string) => { actions.push(`down:${button}`); },
            pressUp: (button: string) => { actions.push(`up:${button}`); },
            restart: () => { actions.push("restart"); },
            resume: () => { status = "running"; actions.push("resume"); },
            saveSRAM: async () => new Blob(["sram"]),
            saveState: async () => ({ state: new Blob(["state"]), thumbnail: undefined }),
            sendCommand: (command: string) => { actions.push(command); },
            start: async () => { status = "running"; actions.push("start"); },
          };
        },
      },
    }),
  });

  const expectedBytes = validNesRom();
  await runtime.prepare({
    expectedSha256: await sha256Hex(expectedBytes),
    expectedSize: expectedBytes.byteLength,
    fileName: "game.nes",
    url: "https://example.test/game.nes",
  });
  await runtime.start();
  runtime.pause();
  runtime.resume();
  runtime.reset();
  const saved = await runtime.captureState();
  await runtime.restoreState(saved.state);
  assert.equal((await runtime.captureBatterySave()).size, 4);
  runtime.pressInput("a");
  runtime.releaseInput("a");
  runtime.setMuted(true);
  runtime.setVolume(0.5);
  runtime.stop();

  assert.deepEqual(actions.slice(0, 4), ["start", "pause", "resume", "restart"]);
  assert.ok(actions.includes("MUTE"));
  assert.equal(actions.filter((action) => action === "VOLUME_DOWN").length, 30);
  assert.equal(actions.at(-1), "exit");
  assert.ok(actions.includes("load-state"));
  assert.ok(actions.includes("down:a"));
  assert.ok(actions.includes("up:a"));
});

test("prepares a local File source without making a network request", async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async () => {
    throw new Error("fetch should not run for a local file");
  };

  let prepared = false;
  const runtime = new NostalgistWasmRuntime({
    canvas: {} as HTMLCanvasElement,
    loadNostalgist: async () => ({
      Nostalgist: {
        async prepare() {
          prepared = true;
          return {
            exit: () => undefined,
            getStatus: () => "initial" as const,
            loadState: async () => undefined,
            pause: () => undefined,
            pressDown: () => undefined,
            pressUp: () => undefined,
            restart: () => undefined,
            resume: () => undefined,
            saveSRAM: async () => new Blob(),
            saveState: async () => ({ state: new Blob(), thumbnail: undefined }),
            sendCommand: () => undefined,
            start: async () => undefined,
          };
        },
      },
    }),
  });

  await runtime.prepare({
    file: new Blob([validNesRom()]),
    fileName: "local.nes",
  });
  assert.equal(prepared, true);
  runtime.stop();
});

test("prepares the Gambatte core for a Game Boy Color ROM", async () => {
  let preparedCore = "";
  const runtime = new NostalgistWasmRuntime({
    canvas: {} as HTMLCanvasElement,
    coreId: "gambatte",
    systemId: "gbc",
    loadNostalgist: async () => ({
      Nostalgist: {
        async prepare(options) {
          preparedCore = String(options.core);
          return {
            exit: () => undefined,
            getStatus: () => "initial" as const,
            loadState: async () => undefined,
            pause: () => undefined,
            pressDown: () => undefined,
            pressUp: () => undefined,
            restart: () => undefined,
            resume: () => undefined,
            saveSRAM: async () => new Blob(),
            saveState: async () => ({ state: new Blob(), thumbnail: undefined }),
            sendCommand: () => undefined,
            start: async () => undefined,
          };
        },
      },
    }),
  });
  const bytes = validGameBoyRom();
  await runtime.prepare({ file: new Blob([bytes]), fileName: "pocket.gbc" });
  assert.equal(preparedCore, "gambatte");
  runtime.stop();
});

test("rejects hosted ROM downloads without immutable evidence", async () => {
  const runtime = new NostalgistWasmRuntime({ canvas: {} as HTMLCanvasElement });
  await assert.rejects(
    () => runtime.prepare({ fileName: "game.nes", url: "https://example.test/game.nes" }),
    /verified byte size and SHA-256 checksum/,
  );
  runtime.stop();
});

test("aborts a stalled hosted launch at its configured deadline", async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async (_input, options) =>
    new Promise((_resolve, reject) => {
      options?.signal?.addEventListener("abort", () => {
        reject(new DOMException("aborted", "AbortError"));
      });
    });

  const bytes = validNesRom();
  const runtime = new NostalgistWasmRuntime({
    canvas: {} as HTMLCanvasElement,
    launchTimeoutMs: 5,
  });
  const expectedSha256 = await sha256Hex(bytes);
  await assert.rejects(
    () => runtime.prepare({
      expectedSha256,
      expectedSize: bytes.byteLength,
      fileName: "game.nes",
      url: "https://example.test/game.nes",
    }),
    /safety deadline/,
  );
  runtime.stop();
});

test("rejects when the emulator core loader ignores the abort signal", async () => {
  const bytes = validNesRom();
  const runtime = new NostalgistWasmRuntime({
    canvas: {} as HTMLCanvasElement,
    launchTimeoutMs: 5,
    loadNostalgist: async () => ({
      Nostalgist: {
        prepare: async () => new Promise(() => undefined),
      },
    }),
  });

  await assert.rejects(
    () => runtime.prepare({ file: new Blob([bytes]), fileName: "game.nes" }),
    /safety deadline/,
  );
  runtime.stop();
});
