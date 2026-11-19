import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guard/jwt-auth.guard.js';
import { JwtUserPayload } from '../common/dto/user.dto.js';
import { FavoritesService } from './favorites.service.js';
import { AddFavoritesDto } from './favorites.dto.js';

type AuthedRequest = { user: JwtUserPayload };

// The signed-in user's favourite games, as Steam app ids. Every route needs a valid
// access token, only touches that user's rows and replies with the whole list.
@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}

  @Get()
  list(@Req() req: AuthedRequest): Promise<number[]> {
    return this.favorites.list(req.user.sub);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  add(
    @Req() req: AuthedRequest,
    @Body() dto: AddFavoritesDto,
  ): Promise<number[]> {
    return this.favorites.add(req.user.sub, dto.AppIds);
  }

  @Delete(':appId')
  remove(
    @Req() req: AuthedRequest,
    @Param('appId', ParseIntPipe) appId: number,
  ): Promise<number[]> {
    return this.favorites.remove(req.user.sub, appId);
  }
}
