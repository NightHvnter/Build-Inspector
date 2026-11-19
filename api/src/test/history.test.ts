import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HistoryController } from '../history/history.controller.js';
import { HistoryService, MAX_ENTRIES } from '../history/history.service.js';
import { HistoryEntity } from '../history/history.entity.js';
import { JwtAuthGuard } from '../guard/jwt-auth.guard.js';
import { CreateHistoryDto } from '../history/history.dto.js';

const DTO: CreateHistoryDto = {
  AppId: 1091500,
  GameName: ' Cyberpunk 2077 ',
  CpuName: 'Intel Core i7-12700K',
  GpuName: '',
  RamGb: 32,
  Met: 4,
  Failed: 0,
  ToCheck: 1,
};

describe('HistoryService', () => {
  let service: HistoryService;
  const repo = {
    find: vitest.fn(),
    findOne: vitest.fn(),
    create: vitest.fn((values) => values),
    merge: vitest.fn((entry, values) => ({ ...entry, ...values })),
    save: vitest.fn(async (entry) => ({ id: entry.id ?? 9, created_at: new Date(0), updated_at: new Date(0), ...entry })),
    delete: vitest.fn(),
  };

  beforeEach(async () => {
    vitest.clearAllMocks();
    repo.find.mockResolvedValue([]);
    const module: TestingModule = await Test.createTestingModule({
      providers: [HistoryService, { provide: getRepositoryToken(HistoryEntity), useValue: repo }],
    }).compile();
    service = module.get(HistoryService);
  });

  it('adds a new entry for the signed-in user, trimming names and empty parts', async () => {
    repo.findOne.mockResolvedValue(null);
    const item = await service.record(42, DTO);
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ UserId: 42, GameName: 'Cyberpunk 2077', GpuName: null, Met: 4 }),
    );
    expect(item).toMatchObject({ id: 9, AppId: 1091500, GameName: 'Cyberpunk 2077' });
    expect(item).not.toHaveProperty('UserId');
  });

  it('adds a new entry every time, also for the same game tested again', async () => {
    const saved = (id: number) => async (entry: object) => ({ id, created_at: new Date(0), updated_at: new Date(0), ...entry });
    repo.save.mockImplementationOnce(saved(9)).mockImplementationOnce(saved(10));
    const first = await service.record(42, DTO);
    const second = await service.record(42, { ...DTO, Met: 3, Failed: 1 });
    expect(repo.create).toHaveBeenCalledTimes(2);
    expect(repo.merge).not.toHaveBeenCalled();
    expect(repo.findOne).not.toHaveBeenCalled();
    expect([first.id, second.id]).toEqual([9, 10]);
    expect(second).toMatchObject({ AppId: 1091500, Met: 3, Failed: 1 });
  });

  it('keeps only the newest entries per user', async () => {
    repo.findOne.mockResolvedValue(null);
    repo.find.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    await service.record(42, DTO);
    expect(repo.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { UserId: 42 }, skip: MAX_ENTRIES }),
    );
    expect(repo.delete).toHaveBeenCalledWith([1, 2]);
  });

  it("deletes only the user's own entry and reports a missing one", async () => {
    repo.delete.mockResolvedValueOnce({ affected: 1 });
    await service.remove(42, 7);
    expect(repo.delete).toHaveBeenCalledWith({ id: 7, UserId: 42 });
    repo.delete.mockResolvedValueOnce({ affected: 0 });
    await expect(service.remove(43, 7)).rejects.toThrow(NotFoundException);
  });

  it("lists and clears only the user's entries", async () => {
    await service.list(42);
    expect(repo.find).toHaveBeenCalledWith(expect.objectContaining({ where: { UserId: 42 } }));
    await service.clear(42);
    expect(repo.delete).toHaveBeenCalledWith({ UserId: 42 });
  });
});

describe('HistoryController', () => {
  it('passes the user id from the access token, never from the body', async () => {
    const history = { list: vitest.fn(), record: vitest.fn(), remove: vitest.fn(), clear: vitest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HistoryController],
      providers: [{ provide: HistoryService, useValue: history }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();
    const controller = module.get(HistoryController);
    const req = { user: { sub: 42, Username: 'test', Email: 'test@example.com' } };
    await controller.record(req as never, { ...DTO, UserId: 1 } as never);
    expect(history.record).toHaveBeenCalledWith(42, expect.anything());
    await controller.remove(req as never, 7);
    expect(history.remove).toHaveBeenCalledWith(42, 7);
  });
});
