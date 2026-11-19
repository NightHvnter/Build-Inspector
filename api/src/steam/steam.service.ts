import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { plainToInstance } from 'class-transformer';
import { SteamApp } from './steam.dto.js';
import { SteamGameEntity } from './steam-game.entity.js';
import { SteamRateLimiter } from './steam-rate-limiter.js';

// Requirements rarely change: ask Steam again after a week.
export const REQUIREMENTS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// What GET /steam/games/:appId returns: the parts of appdetails the app reads.
export type GameRequirementsDetails = Pick<
  SteamApp,
  | 'type'
  | 'name'
  | 'steam_appid'
  | 'short_description'
  | 'header_image'
  | 'pc_requirements'
  | 'mac_requirements'
  | 'linux_requirements'
  | 'platforms'
>;

@Injectable()
export class SteamService {
  private readonly store = 'https://store.steampowered.com/api';
  // In-memory list used by getGamesbyGenre. A field, not a constructor
  // parameter: Nest would try to inject a constructor parameter.
  private readonly steamapps: SteamApp[] = [];

  constructor(
    private readonly http: HttpService,
    @InjectRepository(SteamGameEntity)
    private readonly games: Repository<SteamGameEntity>,
    private readonly limiter: SteamRateLimiter,
  ) {}

    async getGamebyName(term : string) {
    const { data } = await firstValueFrom(
        this.http.get(`${this.store}/storesearch/`, {
        params: { term, l: 'english', cc: 'us' },
      }),
    );
    return (data.items ?? []).map((i: any) => ({
      appId: i.id,
      name: i.name,
      platform : i.platform
    }));
  }

  // A game's name, requirements and platforms (appdetails). Saved in the SteamGame table and
  // asked for again after a week, so reopening a game doesn't reach Steam. Null when Steam
  // doesn't know the id.
  async getGamebyId(appId: string): Promise<GameRequirementsDetails | null> {
    const id = Number(appId);
    if (!/^\d{1,10}$/.test(appId) || !Number.isSafeInteger(id) || id <= 0 || id > 2147483647)
      throw new BadRequestException('Gioco non valido.');

    const saved = await this.games.findOneBy({ AppId: id });
    const cached = saved?.Requirements ? (JSON.parse(saved.Requirements) as GameRequirementsDetails) : null;
    const age = saved?.RequirementsAt ? Date.now() - new Date(saved.RequirementsAt).getTime() : Infinity;
    if (cached && age < REQUIREMENTS_TTL_MS) return cached;

    // Over the limit or Steam unreachable: an old copy is better than nothing.
    const unavailable = (): GameRequirementsDetails => {
      if (cached) return cached;
      throw new ServiceUnavailableException('Steam non è raggiungibile ora. Riprova tra qualche minuto.');
    };
    if (!this.limiter.take('store')) return unavailable();
    let game: unknown;
    try {
      const { data } = await firstValueFrom(
        this.http.get(`${this.store}/appdetails`, {
          params: { appids: id, l: 'italian' },
          timeout: 10000,
        }),
      );
      game = data?.[id]?.data;
    } catch (err) {
      if ((err as { response?: { status?: number } })?.response?.status === 429) this.limiter.rateLimited('store');
      return unavailable();
    }
    if (typeof game !== 'object' || game === null) return null;

    const app = plainToInstance(SteamApp, game, { excludeExtraneousValues: true });
    const details: GameRequirementsDetails = {
      type: app.type,
      name: app.name,
      steam_appid: app.steam_appid,
      short_description: app.short_description,
      header_image: app.header_image,
      pc_requirements: app.pc_requirements,
      mac_requirements: app.mac_requirements,
      linux_requirements: app.linux_requirements,
      platforms: app.platforms,
    };
    await this.games.upsert(
      { AppId: id, Requirements: JSON.stringify(details), RequirementsAt: new Date() },
      ['AppId'],
    );
    return details;
  }

  async getGamesbyGenre(genres: string []){
    return this.steamapps.filter((g) => 
      genres.every((f) => g.genres?.some((genre) => 
        genre.description.toLowerCase() === f.toLocaleLowerCase())))
  }
}