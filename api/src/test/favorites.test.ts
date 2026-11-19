import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FavoritesController } from '../favorites/favorites.controller.js';
import {
  FavoritesService,
  MAX_FAVORITES,
} from '../favorites/favorites.service.js';
import { FavoriteEntity } from '../favorites/favorite.entity.js';
import { AddFavoritesDto } from '../favorites/favorites.dto.js';
import { JwtAuthGuard } from '../guard/jwt-auth.guard.js';

describe('FavoritesService', () => {
  let service: FavoritesService;
  const insert = {
    insert: vitest.fn(),
    values: vitest.fn(),
    orIgnore: vitest.fn(),
    execute: vitest.fn(),
  };
  const repo = {
    find: vitest.fn(),
    count: vitest.fn(),
    delete: vitest.fn(),
    createQueryBuilder: vitest.fn(() => insert),
  };

  beforeEach(async () => {
    vitest.clearAllMocks();
    insert.insert.mockReturnValue(insert);
    insert.values.mockReturnValue(insert);
    insert.orIgnore.mockReturnValue(insert);
    repo.find.mockResolvedValue([]);
    repo.count.mockResolvedValue(0);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoritesService,
        { provide: getRepositoryToken(FavoriteEntity), useValue: repo },
      ],
    }).compile();
    service = module.get(FavoritesService);
  });

  it("lists only the user's app ids", async () => {
    repo.find.mockResolvedValue([{ AppId: 730 }, { AppId: 570 }]);
    expect(await service.list(42)).toEqual([730, 570]);
    expect(repo.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { UserId: 42 } }),
    );
  });

  it('adds only the games that are not favourites yet', async () => {
    repo.find
      .mockResolvedValueOnce([{ AppId: 730 }]) // already there
      .mockResolvedValueOnce([{ AppId: 730 }, { AppId: 570 }]); // the list afterwards
    const list = await service.add(42, [730, 570, 570]);
    expect(insert.values).toHaveBeenCalledWith([{ UserId: 42, AppId: 570 }]);
    expect(insert.orIgnore).toHaveBeenCalled();
    expect(list).toEqual([730, 570]);
  });

  it('writes nothing when every game is already a favourite', async () => {
    repo.find.mockResolvedValue([{ AppId: 730 }]);
    await service.add(42, [730]);
    expect(repo.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('refuses to go over the limit', async () => {
    repo.count.mockResolvedValue(MAX_FAVORITES);
    await expect(service.add(42, [730])).rejects.toThrow(BadRequestException);
    expect(repo.createQueryBuilder).not.toHaveBeenCalled();
  });

  it("removes only the user's own row", async () => {
    await service.remove(42, 730);
    expect(repo.delete).toHaveBeenCalledWith({ UserId: 42, AppId: 730 });
  });
});

describe('AddFavoritesDto', () => {
  const pipe = new ValidationPipe({ transform: true });
  const check = (body: unknown) =>
    pipe.transform(body, { type: 'body', metatype: AddFavoritesDto });

  it('accepts a list of app ids', async () => {
    await expect(check({ AppIds: [730, 570] })).resolves.toMatchObject({
      AppIds: [730, 570],
    });
  });

  it('rejects empty lists, bad ids and missing fields', async () => {
    for (const body of [
      { AppIds: [] },
      { AppIds: [0] },
      { AppIds: ['730'] },
      { AppIds: [1.5] },
      {},
    ])
      await expect(check(body)).rejects.toThrow(BadRequestException);
  });
});

describe('FavoritesController', () => {
  it('passes the user id from the access token, never from the body', async () => {
    const favorites = {
      list: vitest.fn(),
      add: vitest.fn(),
      remove: vitest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FavoritesController],
      providers: [{ provide: FavoritesService, useValue: favorites }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();
    const controller = module.get(FavoritesController);
    const req = {
      user: { sub: 42, Username: 'test', Email: 'test@example.com' },
    };
    await controller.add(req as never, { AppIds: [730], UserId: 1 } as never);
    expect(favorites.add).toHaveBeenCalledWith(42, [730]);
    await controller.remove(req as never, 730);
    expect(favorites.remove).toHaveBeenCalledWith(42, 730);
  });
});
