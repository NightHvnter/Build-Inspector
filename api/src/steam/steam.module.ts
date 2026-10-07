import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { SteamController } from "./steam.controller.js";
import { SteamService } from "./steam.service.js";

@Module({
    imports: [HttpModule],
    controllers: [SteamController],
    providers: [SteamService],
    exports: [],
})
export class SteamModule {}