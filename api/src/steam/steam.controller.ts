import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SteamService } from './steam.service.js';
import { SteamChartsService } from './steam-charts.service.js';
import {
  SteamDetailsService,
  parseIds,
  toGameSummary,
  type GameSummary,
} from './steam-details.service.js';

@ApiTags('steam')
@Controller('steam/games')
export class SteamController {
  constructor(
    private readonly steam: SteamService,
    private readonly charts: SteamChartsService,
    private readonly details: SteamDetailsService,
  ) {}

  // The most played games over the last 7 days (before ':appId', or "top" would match it).
  // ?genre=Azione keeps only the games of that genre (Steam's Italian names).
  @Get('top')
  getTopGames(@Query('limit') limit?: string, @Query('genre') genre?: string) {
    const count = Number(limit ?? 6);
    const wanted = typeof genre === 'string' ? genre.trim().slice(0, 50) : '';
    return this.charts.topGames(
      Number.isSafeInteger(count) && count >= 1 && count <= 24 ? count : 6,
      wanted || undefined,
    );
  }

  // The genres found among the week's charted games, the most common first.
  @Get('top/genres')
  getTopGenres() {
    return this.charts.topGenres();
  }

  // Card data for several games at once: GET /steam/games/details?ids=730,570.
  // Unknown ids are left out; the order of the ids is kept.
  @Get('details')
  async getGamesDetails(@Query('ids') ids?: string): Promise<GameSummary[]> {
    const apps = await this.details.getMany(parseIds(ids));
    return apps.map(toGameSummary);
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
