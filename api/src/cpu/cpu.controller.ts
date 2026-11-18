import {
  Controller,
  Get,
  Param
} from '@nestjs/common';
import { CpuService } from './cpu.service.js';

@Controller('cpu')
export class CpuController {
  constructor(private readonly cpuService: CpuService) {}

  // Every CPU as { Name, Mark }, sorted by name, for the app's configuration form.
  @Get()
  findAll() {
    return this.cpuService.findAll();
  }

  @Get('get/:id')
  findOne(@Param('id') id: string) {
    return this.cpuService.findOne(+id);
  }
}
