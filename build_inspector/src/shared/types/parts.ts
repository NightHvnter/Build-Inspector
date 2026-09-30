export type MemoryType = 'DDR4' | 'DDR5'
export type FormFactor = 'ATX' | 'mATX' | 'ITX'

interface PartBase { id: string; brand: string; model: string }

export interface Cpu extends PartBase {
  socket: string; cores: number; threads: number
  baseClockGhz: number; tdpW: number; memoryTypes: MemoryType[]
}
export interface Gpu extends PartBase {
  vramGb: number; lengthMm: number; tdpW: number
}
export interface Ram extends PartBase {
  type: MemoryType; capacityGb: number; speedMhz: number; modules: number
}
export interface Motherboard extends PartBase {
  socket: string; chipset: string; formFactor: FormFactor
  memoryType: MemoryType; ramSlots: number; maxRamGb: number
}
export interface Psu extends PartBase { wattage: number }
export interface PcCase extends PartBase {
  supportedFormFactors: FormFactor[]
  maxGpuLengthMm: number; maxCoolerHeightMm: number
}