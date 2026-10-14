import {
  Injectable,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { plainToInstance } from 'class-transformer';
import { SteamApp } from './steam.dto.js';

@Injectable()
export class SteamService {
  private readonly store = 'https://store.steampowered.com/api';

  constructor(
    private readonly http: HttpService
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


    async getGamebyId(appId : string) {
    const { data } = await firstValueFrom
    (
        this.http.get(`${this.store}/appdetails`, {
        params: { appids: appId, l: "italian" },
        }),
    );

    const game = data[appId]?.data;
    return plainToInstance(SteamApp, game, { excludeExtraneousValues: true});
    }
}