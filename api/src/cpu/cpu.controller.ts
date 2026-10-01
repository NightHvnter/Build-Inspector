import {
  Controller,
  Get,
  Param
} from '@nestjs/common';
import { CpuService } from './cpu.service.js';

@Controller('Cpu')
export class CpuController {
  constructor(private readonly cpuService: CpuService) {}

  @Get('Get/:id')
  findOne(@Param('id') id: string) {
    return this.cpuService.findOne(+id);
  }
}
