export interface ScannedPc {
  scannedAt: string
  os: { platform: string; distro: string; release: string }
  cpu: { name: string; cores: number; threads: number; baseClockGhz: number; socket: string }
  gpus: { name: string; model: string; vendor: string; vramMb: number }[]
  ram: {
    totalGb: number
    modules: { sizeGb: number; type: string; speedMhz: number; partNumber: string }[]
  }
  storage: { name: string; type: string; sizeGb: number }[]
  motherboard: { manufacturer: string; model: string }
}