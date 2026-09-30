import type { Cpu, Gpu, Ram, Motherboard, Psu, PcCase } from './parts'

export interface Build {
  id: string
  name: string
  cpu: Cpu | null
  gpu: Gpu | null
  ram: Ram | null
  motherboard: Motherboard | null
  psu: Psu | null
  pcCase: PcCase | null
  createdAt: string // ISO string: Firestore Timestamps don't survive IPC
}