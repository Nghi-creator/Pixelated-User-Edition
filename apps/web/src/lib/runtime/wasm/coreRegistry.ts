import type {
  WasmRuntimeFactory,
  WasmRuntimeFactoryOptions,
} from "./runtimeTypes.ts";

export type WasmCoreId = "fceumm";
export type WasmSystemId = "nes";

export type WasmCoreDefinition = {
  artifactExtensions: readonly string[];
  coreId: WasmCoreId;
  label: string;
  loadRuntime: WasmRuntimeFactory;
  systemId: WasmSystemId;
  systemLabel: string;
};

const loadFceummRuntime = async (options: WasmRuntimeFactoryOptions) => {
  const { NostalgistWasmRuntime } = await import("./NostalgistWasmRuntime.ts");
  return new NostalgistWasmRuntime({
    ...options,
    coreId: "fceumm",
  });
};

export const WASM_CORE_REGISTRY: readonly WasmCoreDefinition[] = [
  {
    artifactExtensions: [".nes"],
    coreId: "fceumm",
    label: "FCEUmm",
    loadRuntime: loadFceummRuntime,
    systemId: "nes",
    systemLabel: "NES",
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
