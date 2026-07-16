import assert from "node:assert/strict";
import test from "node:test";
import { NostalgistWasmRuntime } from "../../../src/lib/runtime/wasm/NostalgistWasmRuntime.ts";

function validNesRom() {
  const bytes = new Uint8Array(32);
  bytes.set([0x4e, 0x45, 0x53, 0x1a]);
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
          return {
            exit: () => { status = "terminated"; actions.push("exit"); },
            getStatus: () => status,
            pause: () => { status = "paused"; actions.push("pause"); },
            restart: () => { actions.push("restart"); },
            resume: () => { status = "running"; actions.push("resume"); },
            sendCommand: (command: string) => { actions.push(command); },
            start: async () => { status = "running"; actions.push("start"); },
          };
        },
      },
    }),
  });

  await runtime.prepare({ fileName: "game.nes", url: "https://example.test/game.nes" });
  await runtime.start();
  runtime.pause();
  runtime.resume();
  runtime.reset();
  runtime.setMuted(true);
  runtime.setVolume(0.5);
  runtime.stop();

  assert.deepEqual(actions.slice(0, 5), ["start", "pause", "resume", "restart", "MUTE"]);
  assert.equal(actions.filter((action) => action === "VOLUME_DOWN").length, 30);
  assert.equal(actions.at(-1), "exit");
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
            pause: () => undefined,
            restart: () => undefined,
            resume: () => undefined,
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
