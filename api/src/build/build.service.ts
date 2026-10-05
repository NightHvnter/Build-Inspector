import { Injectable } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';

import { GpuDto as Gpu, CpuDto as Cpu, RamDto, RamDtoWithScore } from "../common/dto/index.js"
import { Repository } from "typeorm";

@Injectable()
export class BuildService {
    constructor(
        @InjectRepository(Gpu)
        private readonly GpuRepo: Repository<Gpu>,
        @InjectRepository(Cpu)
        private readonly CpuRepo: Repository<Cpu>,
    ) {}

    async GetCpu(name: string): Promise<Cpu> {
        const dbdata = await this.CpuRepo.findOneBy({Name: name})
        const CpuData: Cpu = {
            id: dbdata?.id,
            created_at: dbdata?.created_at,
            Name: dbdata?.Name,
            Mark: dbdata?.Mark,
            Cores: dbdata?.Cores,
            Socket: dbdata?.Socket
        }

        return CpuData;
    }

    async GetGpu(name: string): Promise<Gpu> {
        const dbdata = await this.GpuRepo.findOneBy({Name: name})
        const GpuData: Gpu = {
            id: dbdata?.id,
            created_at: dbdata?.created_at,
            Name: dbdata?.Name,
            Mark: dbdata?.Mark
        }

        return GpuData;
    }

    private GetFormFactor(type: "DDR3" | "DDR4" | "DDR5") {
        switch(type) {
            case "DDR3":
                return 0.8
            case "DDR4":
                return 1
            case "DDR5":
                return 1.2
            default:
                return 1
        }
    }

    async CalcRam(ram: RamDto): RamDtoWithScore {
        const realLatency = (Number.isNaN(ram.Latency) ? Number(ram.Latency) : 16 * 2000)
        const Sv = (ram.ClockSpeedMHz * this.GetFormFactor(ram.Type)) / 100
        
    }

    async GetBuildScore(cpuName: string, gpuName: string, clientRam: RamDto) {
        const cpu: Cpu = await this.GetCpu(cpuName);
        const gpu: Gpu = await this.GetGpu(gpuName);
        const ram: RamDtoWithScore = await this.CalcRam(clientRam);
    }
}