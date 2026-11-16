// One CPU or GPU from the API (GET /cpu, GET /gpu), with its PassMark benchmark score.
export interface HardwarePart {
  name: string
  mark: number
}

// Every CPU and GPU the API knows, sorted by name.
export interface HardwareCatalog {
  cpus: HardwarePart[]
  gpus: HardwarePart[]
}

export type HardwareCatalogReply =
  { ok: true; data: HardwareCatalog } | { ok: false; message: string }

// What the preload exposes to the renderer as window.api.hardware.
export interface HardwareApi {
  catalog(): Promise<HardwareCatalogReply>
}
