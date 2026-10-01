import { GpuService } from './gpu.service.js';
import { GpuController } from './gpu.controller.js';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GpuEntity } from './gpu.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([GpuEntity])],
  controllers: [ GpuController,],
  providers: [ GpuService,],
  exports: []
})
export class GpuModule {}
