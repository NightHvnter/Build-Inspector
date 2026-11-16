import {
  Controller,
  Get,
  Param
} from '@nestjs/common';
import { GpuService } from './gpu.service.js';

@Controller('gpu')
export class GpuController {
  constructor(private readonly gpuService: GpuService) {}

  // Every GPU as { Name, Mark }, sorted by name, for the app's configuration form.
  @Get()
  findAll() {
    return this.gpuService.findAll();
  }

  @Get('get/:id')
  findOne(@Param('id') id: string) {
    return this.gpuService.findOne(+id);
  }
}
