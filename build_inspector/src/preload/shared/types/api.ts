export interface RamDto {
  Name: string
  CapacityGb: number
  ClockSpeedMHz: number
  Latency: string
  Type: 'DDR5' | 'DDR4' | 'DDR3'
}

export interface LookupDto {
  Name: string
  Score: number
}

export interface CpuDto {
  id?: number
  Name?: string
  Mark?: number
  Cores?: number
  Socket?: string
  HasIntegratedGpu?: boolean
}

export interface GpuDto {
  id?: number
  Name?: string
  Mark?: number
}

export interface BuildScoreRequest {
  Ram: RamDto
  Cpu: string 
  Gpu: string 
}

export interface BuildResponse {
  score: number
  message: string
}