import { Injectable } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';

import { GpuDto as Gpu, CpuDto as Cpu, RamDto, RamDtoWithScore } from "../common/dto/index.js"
import {GpuEntity, CpuEntity} from "../common/entity/index.js"
import { ILike, Repository } from "typeorm";
import { BuildDto, Scores } from "./build.dto.js";

@Injectable()
export class BuildService {
    constructor(
        @InjectRepository(GpuEntity)
        private readonly GpuRepo: Repository<GpuEntity>,
        @InjectRepository(CpuEntity)
        private readonly CpuRepo: Repository<CpuEntity>,
    ) {}

    async GetCpu(name: string): Promise<Cpu> {
        
        const dbdata = await this.CpuRepo.findOne({
            where: { Name: ILike(`%${name}%`)}
        })

        console.log(dbdata)
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
        const dbdata = await this.GpuRepo.findOne({
            where: { Name: ILike(`%${name}`)}
        })
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

    GetRamWithScore(ram: RamDto): RamDtoWithScore {
        const realLatency = (Number.isNaN(ram.Latency) ? Number(ram.Latency) : 16 * 2000)
        const Sv = (ram.ClockSpeedMHz * this.GetFormFactor(ram.Type)) / 100
        const Sl = Math.max(0.20 - realLatency) * 5;
        const Sc = Math.min(ram.CapacityGb, 64) * 2;
        const score = (Sv * 0.4) + (Sl * 0.3) + (Sc * 0.3);

        return {
            ...ram,
            Mark: score
        }
    }

    async GetBuildScore(build: BuildDto): Promise<Scores> {
        const cpu: Cpu = await this.GetCpu(build.cpu);
        const gpu: Gpu = await this.GetGpu(build.gpu);
        const ram: RamDtoWithScore = this.GetRamWithScore(build.ram);

        return {
            Cpu: cpu.Mark,
            Gpu: gpu.Mark,
            Ram: ram.Mark
        }
    }
}