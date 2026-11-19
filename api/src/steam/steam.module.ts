import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SteamController } from "./steam.controller.js";
import { SteamService } from "./steam.service.js";
import { SteamChartsService } from "./steam-charts.service.js";
import { SteamChartDayEntity } from "./chart-day.entity.js";
import { SteamDetailsService } from "./steam-details.service.js";
import { SteamGameEntity } from "./steam-game.entity.js";
import { SteamRateLimiter } from "./steam-rate-limiter.js";

@Module({
    imports: [HttpModule, TypeOrmModule.forFeature([SteamChartDayEntity, SteamGameEntity])],
    controllers: [SteamController],
    providers: [SteamService, SteamChartsService, SteamDetailsService, SteamRateLimiter],
    exports: [],
})
export class SteamModule {}
