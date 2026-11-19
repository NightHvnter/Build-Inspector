import {
  BATCH_SIZE,
  CARD_TTL_MS,
  MAX_IDS,
  SteamDetailsService,
  isPlayableGame,
  parseIds,
  parseStoreItem,
} from '../steam/steam-details.service.js';
import {
  SteamRateLimiter,
  LIMITS,
  BACKOFF_MS,
} from '../steam/steam-rate-limiter.js';
import type { SteamGameEntity } from '../steam/steam-game.entity.js';

const NOW = new Date('2026-11-19T10:00:00Z');

// A store item as GetItems returns it.
const item = (appid: number, extra: Record<string, unknown> = {}) => ({
  appid,
  id: appid,
  success: 1,
  type: 0,
  name: 'Gioco ' + appid,
  basic_info: { short_description: 'Descrizione &amp; altro' },
  tags: [
    { tagid: 19, weight: 300 },
    { tagid: 122, weight: 900 },
  ],
  assets: {
    asset_url_format: `steam/apps/${appid}/\${FILENAME}?t=1`,
    header: 'abc123/header.jpg',
  },
  ...extra,
});

describe('parseIds', () => {
  it('keeps valid ids once, in order', () => {
    expect(parseIds('730, 570,abc,730,0,-5,1.5,99999999999')).toEqual([
      730, 570,
    ]);
    expect(parseIds(undefined)).toEqual([]);
  });

  it('accepts at most MAX_IDS ids', () => {
    const many = Array.from({ length: MAX_IDS + 20 }, (_, i) => i + 1).join(
      ',',
    );
    expect(parseIds(many)).toHaveLength(MAX_IDS);
  });
});

describe('parseStoreItem', () => {
  it("keeps the card data, tags by votes and the cover's address on Steam's CDN", () => {
    expect(parseStoreItem(item(730), NOW)).toEqual({
      AppId: 730,
      Found: true,
      Type: 0,
      Name: 'Gioco 730',
      Description: 'Descrizione & altro',
      TagIds: [122, 19],
      ImageUrl:
        'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/730/abc123/header.jpg?t=1',
      UpdatedAt: NOW,
    });
  });

  it('marks unknown ids and refuses unusable answers', () => {
    // As Steam answers for an unknown id: appid 0, the id asked for in `id`.
    expect(parseStoreItem({ id: 1, appid: 0, success: 15, name: '' }, NOW)).toEqual({
      AppId: 1,
      Found: false,
      UpdatedAt: NOW,
    });
    expect(parseStoreItem({ ...item(1), name: ' ' }, NOW)).toBeNull();
    expect(parseStoreItem({ ...item(1), success: 2 }, NOW)).toBeNull();
    expect(parseStoreItem(null, NOW)).toBeNull();
  });

  it('never builds a cover address from a path outside the app', () => {
    const odd = parseStoreItem(
      item(5, {
        assets: {
          asset_url_format: 'https://evil.example/${FILENAME}',
          header: 'x.jpg',
        },
      }),
      NOW,
    );
    expect(odd?.ImageUrl).toBe(
      'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/5/header.jpg',
    );
    const climbing = parseStoreItem(
      item(5, {
        assets: {
          asset_url_format: 'steam/apps/5/${FILENAME}',
          header: '../../x.jpg',
        },
      }),
      NOW,
    );
    expect(climbing?.ImageUrl).toBe(
      'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/5/header.jpg',
    );
  });
});

describe('SteamRateLimiter', () => {
  it('lets through at most the limit per window, then again once it has passed', () => {
    const limiter = new SteamRateLimiter();
    const { max, windowMs } = LIMITS.store;
    for (let i = 0; i < max; i++)
      expect(limiter.take('store', 1000)).toBe(true);
    expect(limiter.take('store', 1000)).toBe(false);
    // The other host has its own count.
    expect(limiter.take('webapi', 1000)).toBe(true);
    expect(limiter.take('store', 1000 + windowMs)).toBe(true);
  });

  it('stops asking after a 429', () => {
    const limiter = new SteamRateLimiter();
    limiter.rateLimited('store', 0);
    expect(limiter.take('store', BACKOFF_MS - 1)).toBe(false);
    expect(limiter.take('store', BACKOFF_MS)).toBe(true);
  });
});

describe('SteamDetailsService', () => {
  const fetchMock = vitest.fn();
  let table: Map<number, Partial<SteamGameEntity>>;
  const repo = {
    findBy: vitest.fn(async ({ AppId }: { AppId: { value: number[] } }) =>
      AppId.value.flatMap((id) =>
        table.has(id) ? [{ ...table.get(id) } as SteamGameEntity] : [],
      ),
    ),
    upsert: vitest.fn(async (rows: Partial<SteamGameEntity>[]) => {
      for (const row of [rows].flat())
        table.set(row.AppId!, { ...table.get(row.AppId!), ...row });
    }),
  };

  function itemsFrom(url: string): number[] {
    const input = JSON.parse(decodeURIComponent(url.split('input_json=')[1]));
    return input.ids.map((i: { appid: number }) => i.appid);
  }

  beforeEach(() => {
    table = new Map();
    vitest.clearAllMocks();
    vitest.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('GetTagList'))
        return {
          ok: true,
          status: 200,
          json: async () => ({
            response: {
              tags: [
                { tagid: 19, name: 'Azione' },
                { tagid: 122, name: 'GDR' },
              ],
            },
          }),
        };
      const ids = itemsFrom(url);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          response: {
            store_items: ids.map((id) =>
              id === 404
                ? { id, success: 15 }
                : item(id, id === 2 ? { type: 4 } : {}),
            ),
          },
        }),
      };
    });
  });

  afterEach(() => {
    vitest.unstubAllGlobals();
    vitest.useRealTimers();
  });

  const itemCalls = () =>
    fetchMock.mock.calls.filter(([url]) => String(url).includes('GetItems'));

  it('asks Steam for many games in one request and saves them', async () => {
    const service = new SteamDetailsService(
      repo as never,
      new SteamRateLimiter(),
    );
    const apps = await service.getMany([30, 404, 2, 10]);
    expect(apps.map((a) => [a.appId, a.name, a.genres])).toEqual([
      [30, 'Gioco 30', ['GDR', 'Azione']],
      [2, 'Gioco 2', ['GDR', 'Azione']],
      [10, 'Gioco 10', ['GDR', 'Azione']],
    ]);
    expect(itemCalls()).toHaveLength(1);
    expect(isPlayableGame(apps[1])).toBe(false); // a DLC
    expect(table.get(404)).toMatchObject({ Found: false });
  });

  it('answers from the database without asking Steam again', async () => {
    const service = new SteamDetailsService(
      repo as never,
      new SteamRateLimiter(),
    );
    await service.getMany([730, 570]);
    await service.getMany([570, 730, 404]);
    // Only 404 was new the second time; unknown ids are remembered too.
    expect(itemCalls().map(([url]) => itemsFrom(url))).toEqual([
      [730, 570],
      [404],
    ]);
    await service.getMany([404]);
    expect(itemCalls()).toHaveLength(2);
  });

  it('splits more than a batch into a few requests', async () => {
    const service = new SteamDetailsService(
      repo as never,
      new SteamRateLimiter(),
    );
    const ids = Array.from({ length: BATCH_SIZE + 50 }, (_, i) => i + 1000);
    expect(await service.getMany(ids)).toHaveLength(ids.length);
    expect(itemCalls().map(([url]) => itemsFrom(url).length)).toEqual([
      BATCH_SIZE,
      50,
    ]);
  });

  it('shares a request already on its way', async () => {
    const service = new SteamDetailsService(
      repo as never,
      new SteamRateLimiter(),
    );
    await Promise.all([
      service.getMany([730]),
      service.getMany([730]),
      service.get(730),
    ]);
    expect(itemCalls()).toHaveLength(1);
  });

  it('refreshes a week-old game, keeping the old data if Steam fails', async () => {
    vitest.useFakeTimers({ now: NOW });
    const service = new SteamDetailsService(
      repo as never,
      new SteamRateLimiter(),
    );
    await service.getMany([730]);
    vitest.setSystemTime(NOW.getTime() + CARD_TTL_MS + 1);
    fetchMock.mockImplementation(async (url: string) =>
      url.includes('GetTagList')
        ? { ok: false, status: 500 }
        : { ok: false, status: 429, json: async () => ({}) },
    );
    const [app] = await service.getMany([730]);
    expect(app.name).toBe('Gioco 730');
    expect(itemCalls()).toHaveLength(2);
  });

  it('uses only the database once over the limit', async () => {
    const limiter = new SteamRateLimiter();
    limiter.rateLimited('webapi');
    table.set(730, {
      AppId: 730,
      Found: true,
      Type: 0,
      Name: 'Salvato',
      Description: '',
      TagIds: [],
      ImageUrl: '',
      UpdatedAt: new Date(0),
    });
    const service = new SteamDetailsService(repo as never, limiter);
    expect((await service.getMany([730, 570])).map((a) => a.name)).toEqual([
      'Salvato',
    ]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
