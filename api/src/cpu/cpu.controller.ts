import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CpuService } from './cpu.service.js';

@Controller('cpus')
export class CpuController {
  constructor(private readonly cpuService: CpuService) {}

  @Get()
  findAll() {
    return this.cpuService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cpuService.findOne(+id);
  }
}
