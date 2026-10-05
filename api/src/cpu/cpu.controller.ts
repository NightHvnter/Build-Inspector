import {
  Controller,
  Get,
  Param
} from '@nestjs/common';
import { CpuService } from './cpu.service.js';

@Controller('cpu')
export class CpuController {
  constructor(private readonly cpuService: CpuService) {}

  @Get('get/:id')
  findOne(@Param('id') id: string) {
    return this.cpuService.findOne(+id);
  }
}
