import { RamDto } from "../common/dto/ram.dto.js";

export class Scores {
    Cpu: number | undefined;
    Gpu: number | undefined;
    Ram: number | undefined;
}

export class BuildDto {
    cpu: string;
    gpu: string;
    ram: RamDto;
}