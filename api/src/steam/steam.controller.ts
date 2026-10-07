import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SteamService } from './steam.service.js';

@ApiTags('steam')
@Controller('steam/games')
export class SteamController {
  constructor(private readonly steam: SteamService) {}

  @Get('search')
  getGamebyName(@Query('q') q: string) {
    return this.steam.getGamebyName(q);
  }

  @Get(':appId')
  getGamebyId(@Param('appId') appId: string) {
    return this.steam.getGamebyId(appId);
  }
}
