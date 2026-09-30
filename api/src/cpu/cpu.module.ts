import { CpuService } from './cpu.service.js';
import { CpuController } from './cpu.controller.js';
import { Module } from '@nestjs/common';

@Module({
  imports: [],
  controllers: [ CpuController,],
  providers: [ CpuService,],
  exports: []
})
export class CpuModule {}
