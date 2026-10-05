import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GpuEntity } from "../common/entity/gpu.entity.js";
import { CpuEntity } from "../common/entity/cpu.entity.js";
import { BuildController } from "./build.controller.js";
import { BuildService } from "./build.service.js";

@Module({
  imports: [TypeOrmModule.forFeature([GpuEntity, CpuEntity])],
  controllers: [ BuildController,],
  providers: [ BuildService,],
  exports: []
})
export class BuildModule {}
