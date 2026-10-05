import { Get, Injectable } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';

import { GpuDto as Gpu, CpuDto as Cpu } from "../common/dto/index.js"
import { Repository } from "typeorm";

@Injectable()
export class BuildService {
    constructor(
        @InjectRepository(Gpu)
        private readonly GpuRepo: Repository<Gpu>,
        @InjectRepository(Cpu)
        private readonly CpuRepo: Repository<Cpu>,
    ) {}

    @Get()
    async GetCpu(name: string): Promise<Gpu> {
        const dbdata = await this.CpuRepo.findOneBy({Name: name})
        const GpuData: Cpu = {
            id: dbdata?.id,
            created_at: dbdata?.created_at,
            Name: dbdata?.Name,
            Mark: dbdata?.Mark
        }

        return GpuData;
    }

    @Get()
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
}