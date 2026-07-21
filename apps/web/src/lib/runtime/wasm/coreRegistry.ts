import type {
  WasmRuntimeFactory,
  WasmRuntimeFactoryOptions,
} from "./runtimeTypes.ts";

export type WasmCoreId = "fceumm" | "gambatte";
export type WasmSystemId = "nes" | "gb" | "gbc";

export type WasmCoreDefinition = {
  artifactExtensions: readonly string[];
  coreId: WasmCoreId;
  label: string;
  loadRuntime: WasmRuntimeFactory;
  systemId: WasmSystemId;
  systemLabel: string;
};

const loadNostalgistRuntime = async (
  coreId: WasmCoreId,
  systemId: WasmSystemId,
  options: WasmRuntimeFactoryOptions,
) => {
  const { NostalgistWasmRuntime } = await import("./NostalgistWasmRuntime.ts");
  return new NostalgistWasmRuntime({
    ...options,
    coreId,
    systemId,
  });
};

export const WASM_CORE_REGISTRY: readonly WasmCoreDefinition[] = [
  {
    artifactExtensions: [".nes"],
    coreId: "fceumm",
    label: "FCEUmm",
    loadRuntime: (options) => loadNostalgistRuntime("fceumm", "nes", options),
    systemId: "nes",
    systemLabel: "NES",
  },
  {
    artifactExtensions: [".gb"],
    coreId: "gambatte",
    label: "Gambatte",
    loadRuntime: (options) => loadNostalgistRuntime("gambatte", "gb", options),
    systemId: "gb",
    systemLabel: "Game Boy",
  },
  {
    artifactExtensions: [".gbc"],
    coreId: "gambatte",
    label: "Gambatte",
    loadRuntime: (options) => loadNostalgistRuntime("gambatte", "gbc", options),
    systemId: "gbc",
    systemLabel: "Game Boy Color",
  },
];

function hasSupportedExtension(
  definition: WasmCoreDefinition,
  fileName: string,
) {
  const normalizedFileName = fileName.toLowerCase();
  return definition.artifactExtensions.some((extension) =>
    normalizedFileName.endsWith(extension),
  );
}

export function findWasmCoreForArtifact(
  systemId: string | null | undefined,
  fileName: string | null | undefined,
) {
  if (!systemId || !fileName) return null;
  return WASM_CORE_REGISTRY.find(
    (definition) =>
      definition.systemId === systemId &&
      hasSupportedExtension(definition, fileName),
  ) || null;
}

export function resolveWasmCore(
  coreId: string | null | undefined,
  systemId: string | null | undefined,
  fileName: string | null | undefined,
) {
  if (!coreId || !systemId || !fileName) return null;
  return WASM_CORE_REGISTRY.find(
    (definition) =>
      definition.coreId === coreId &&
      definition.systemId === systemId &&
      hasSupportedExtension(definition, fileName),
  ) || null;
}
