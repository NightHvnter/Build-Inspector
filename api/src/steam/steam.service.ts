import {
  Inject,
  Injectable,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { firstValueFrom } from 'rxjs';
import { platform } from 'os';

@Injectable()
export class SteamService {
  private readonly store = 'https://store.steampowered.com/api';

  constructor(private readonly http: HttpService) {}

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


    async getGamebyId(appId : string) {
    const { data } = await firstValueFrom
    (
        this.http.get(`${this.store}/appdetails`, {
        params: { appids: appId },
        }),
    );

    const game = data[appId]?.data;
    return {
        appId: game.steam_appid,
        name: game.name,
        requirements: game.pc_requirements,
        };
    }
}