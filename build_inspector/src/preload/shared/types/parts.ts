export type MemoryType = 'DDR4' | 'DDR5';

interface PartBase {
  Id: string;
  Name: string;
  Mark: Number;
}

export interface Cpu extends PartBase {
  Socket: string;
  Cores: number;
}
export interface Gpu extends PartBase {}

export interface Ram extends PartBase {
  type: MemoryType;
  CapacityGb: number;
  ClockSpeed: number;
}
