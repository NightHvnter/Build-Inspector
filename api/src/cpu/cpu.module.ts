import { CpuService } from './cpu.service.js';
import { CpuController } from './cpu.controller.js';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CpuEntity } from './cpu.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([CpuEntity])],
  controllers: [ CpuController,],
  providers: [ CpuService,],
  exports: []
})
export class CpuModule {}
