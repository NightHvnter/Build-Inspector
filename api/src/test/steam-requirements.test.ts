import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { SteamService, REQUIREMENTS_TTL_MS } from '../steam/steam.service.js';
import { SteamRateLimiter } from '../steam/steam-rate-limiter.js';

const APP = {
  type: 'game',
  name: 'Cyberpunk 2077',
  steam_appid: 1091500,
  short_description: 'Un GDR.',
  header_image: 'https://shared.akamai.steamstatic.com/header.jpg',
  pc_requirements: { minimum: '<ul><li>Memoria: 12 GB</li></ul>' },
  mac_requirements: [],
  linux_requirements: [],
  platforms: { windows: true, mac: false, linux: false },
  screenshots: [{ id: 1 }], // not kept
};

describe('SteamService.getGamebyId', () => {
  const http = { get: vitest.fn() };
  const repo = { findOneBy: vitest.fn(), upsert: vitest.fn() };
  let limiter: SteamRateLimiter;
  let service: SteamService;

  beforeEach(() => {
    vitest.clearAllMocks();
    limiter = new SteamRateLimiter();
    service = new SteamService(http as never, repo as never, limiter);
    repo.findOneBy.mockResolvedValue(null);
    http.get.mockReturnValue(
      of({ data: { 1091500: { success: true, data: APP } } }),
    );
  });

  it('asks Steam once and saves only what the app reads', async () => {
    const details = await service.getGamebyId('1091500');
    expect(details).toMatchObject({
      name: 'Cyberpunk 2077',
      pc_requirements: APP.pc_requirements,
    });
    expect(details).not.toHaveProperty('screenshots');
    expect(repo.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        AppId: 1091500,
        RequirementsAt: expect.any(Date),
      }),
      ['AppId'],
    );
    expect(JSON.parse(repo.upsert.mock.calls[0][0].Requirements)).toEqual(
      details,
    );
  });

  it('answers from the database within a week', async () => {
    repo.findOneBy.mockResolvedValue({
      Requirements: JSON.stringify({ name: 'Salvato' }),
      RequirementsAt: new Date(),
    });
    expect(await service.getGamebyId('1091500')).toEqual({ name: 'Salvato' });
    expect(http.get).not.toHaveBeenCalled();
  });

  it('keeps the old copy and backs off when Steam answers 429', async () => {
    repo.findOneBy.mockResolvedValue({
      Requirements: JSON.stringify({ name: 'Vecchio' }),
      RequirementsAt: new Date(Date.now() - REQUIREMENTS_TTL_MS - 1),
    });
    http.get.mockReturnValue(throwError(() => ({ response: { status: 429 } })));
    expect(await service.getGamebyId('1091500')).toEqual({ name: 'Vecchio' });
    expect(limiter.take('store')).toBe(false);
  });

  it('says Steam is unavailable when over the limit with nothing saved', async () => {
    limiter.rateLimited('store');
    await expect(service.getGamebyId('1091500')).rejects.toThrow(
      ServiceUnavailableException,
    );
    expect(http.get).not.toHaveBeenCalled();
  });

  it('returns null for an id Steam does not know, and refuses bad ids', async () => {
    http.get.mockReturnValue(of({ data: { 1: { success: false } } }));
    expect(await service.getGamebyId('1')).toBeNull();
    await expect(service.getGamebyId('abc')).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.getGamebyId('0')).rejects.toThrow(BadRequestException);
  });
});
