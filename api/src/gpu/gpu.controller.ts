import {
  Controller,
  Get,
  Param
} from '@nestjs/common';
import { GpuService } from './gpu.service.js';

@Controller('gpu')
export class GpuController {
  constructor(private readonly gpuService: GpuService) {}

  @Get('get/:id')
  findOne(@Param('id') id: string) {
    return this.gpuService.findOne(+id);
  }
}
