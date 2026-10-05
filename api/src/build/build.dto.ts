import * as dto from "../common/dto/index.js";

export class BuildDto {
    Cpu: dto.CpuDto;
    Gpu: dto.GpuDto;
    Ram: dto.RamDto;
    Score: number;
}