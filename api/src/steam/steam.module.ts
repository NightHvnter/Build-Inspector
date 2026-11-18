import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SteamController } from "./steam.controller.js";
import { SteamService } from "./steam.service.js";
import { SteamChartsService } from "./steam-charts.service.js";
import { SteamChartDayEntity } from "./chart-day.entity.js";

@Module({
    imports: [HttpModule, TypeOrmModule.forFeature([SteamChartDayEntity])],
    controllers: [SteamController],
    providers: [SteamService, SteamChartsService],
    exports: [],
})
export class SteamModule {}
