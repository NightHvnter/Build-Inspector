import type { Cpu, Gpu, Ram } from './parts'

export interface Build {
  id: string
  cpu: Cpu | null
  gpu: Gpu | null
  ram: Ram | null
}