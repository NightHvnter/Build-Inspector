import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { FavoriteEntity } from './favorite.entity.js';

// Favourites kept per user.
export const MAX_FAVORITES = 500;

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(FavoriteEntity)
    private readonly repo: Repository<FavoriteEntity>,
  ) {}

  // The user's favourite app ids, oldest first.
  async list(userId: number): Promise<number[]> {
    const rows = await this.repo.find({
      select: { AppId: true },
      where: { UserId: userId },
      order: { created_at: 'ASC', id: 'ASC' },
      take: MAX_FAVORITES,
    });
    return rows.map((row) => row.AppId);
  }

  // Adds the games that aren't favourites yet and returns the whole list.
  async add(userId: number, appIds: number[]): Promise<number[]> {
    const wanted = [...new Set(appIds)];
    const existing = await this.repo.find({
      select: { AppId: true },
      where: { UserId: userId, AppId: In(wanted) },
    });
    const known = new Set(existing.map((row) => row.AppId));
    const fresh = wanted.filter((appId) => !known.has(appId));
    if (fresh.length) {
      const count = await this.repo.count({ where: { UserId: userId } });
      if (count + fresh.length > MAX_FAVORITES)
        throw new BadRequestException(
          `Puoi avere al massimo ${MAX_FAVORITES} preferiti.`,
        );
      // orIgnore: a second request racing this one doesn't fail on the unique index.
      await this.repo
        .createQueryBuilder()
        .insert()
        .values(fresh.map((AppId) => ({ UserId: userId, AppId })))
        .orIgnore()
        .execute();
    }
    return this.list(userId);
  }

  // Removing a game that isn't a favourite is not an error: the result is the same.
  async remove(userId: number, appId: number): Promise<number[]> {
    await this.repo.delete({ UserId: userId, AppId: appId });
    return this.list(userId);
  }
}
