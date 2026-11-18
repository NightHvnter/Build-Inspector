import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SteamService } from './steam.service.js';
import { SteamChartsService } from './steam-charts.service.js';

@ApiTags('steam')
@Controller('steam/games')
export class SteamController {
  constructor(
    private readonly steam: SteamService,
    private readonly charts: SteamChartsService,
  ) {}

  // The most played games over the last 7 days (before ':appId', or "top" would match it).
  @Get('top')
  getTopGames(@Query('limit') limit?: string) {
    const count = Number(limit ?? 6);
    return this.charts.topGames(Number.isSafeInteger(count) && count >= 1 && count <= 24 ? count : 6);
  }

  @Get('search')
  getGamebyName(@Query('q') q: string) {
    return this.steam.getGamebyName(q);
  }

  @Get(':appId')
  getGamebyId(@Param('appId') appId: string) {
    return this.steam.getGamebyId(appId);
  }
}
