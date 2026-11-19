import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { BuildService } from './build.service.js';
import { RamDto, RamDtoWithScore } from '../common/dto/ram.dto.js';
import { BuildDto, Scores } from './build.dto.js';

@Controller('build')
export class BuildController {
    constructor(private readonly buildService: BuildService){}

    @Get("cpu/:name")
    GetCpu(@Param("name") name: string) {
        return this.buildService.GetCpu(name);
    }

    @Get("gpu/:name")
    GetGpu(@Param("name") name: string) {
        return this.buildService.GetGpu(name);
    }

    @Post("ram/calc")
    CalcRam(@Body("ram") ram: RamDto): RamDtoWithScore {
        return this.buildService.GetRamWithScore(ram);
    }

    @Post("score")
    CalcScore(@Body() build: BuildDto): Promise<Scores> {
        return this.buildService.GetBuildScore(build);
    }
}
