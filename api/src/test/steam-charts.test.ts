import { SteamChartsService, rankOverDays, type ChartRow } from '../steam/steam-charts.service.js';

const DAYS = ['2026-11-17', '2026-11-16', '2026-11-15'];

describe('rankOverDays', () => {
  it('ranks by the average position over the days, a missing day counting as 101', () => {
    const rows: ChartRow[] = [
      // Steady at 2nd every day.
      { Day: '2026-11-17', AppId: 570, Rank: 2 },
      { Day: '2026-11-16', AppId: 570, Rank: 2 },
      { Day: '2026-11-15', AppId: 570, Rank: 2 },
      // 1st only today: a one-day spike shouldn't beat a steady game.
      { Day: '2026-11-17', AppId: 4262460, Rank: 1 },
      // 3rd, 3rd, 1st.
      { Day: '2026-11-17', AppId: 730, Rank: 3 },
      { Day: '2026-11-16', AppId: 730, Rank: 3 },
      { Day: '2026-11-15', AppId: 730, Rank: 1 },
      // An older day the ranking doesn't cover.
      { Day: '2026-11-01', AppId: 1, Rank: 1 },
    ];
    expect(rankOverDays(rows, DAYS)).toEqual([
      { appId: 570, averageRank: 2 },
      { appId: 730, averageRank: 2.3 },
      { appId: 4262460, averageRank: 67.7 },
    ]);
  });

  it("breaks ties with the latest day's rank", () => {
    const rows: ChartRow[] = [
      { Day: '2026-11-17', AppId: 1, Rank: 4 },
      { Day: '2026-11-16', AppId: 1, Rank: 2 },
      { Day: '2026-11-17', AppId: 2, Rank: 2 },
      { Day: '2026-11-16', AppId: 2, Rank: 4 },
    ];
    expect(rankOverDays(rows, DAYS.slice(0, 2)).map((g) => g.appId)).toEqual([2, 1]);
  });
});

describe('SteamChartsService by genre', () => {
  const app = (appId: number, genres: string[], type = 0) => ({
    appId,
    type,
    name: 'Gioco ' + appId,
    description: '',
    genres,
    image: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/header.jpg`,
  });
  // Ranked 1 to 5 on a single day.
  const APPS = [
    app(1, ['Azione', 'Free-to-Play']),
    app(2, ['Strategia']),
    app(3, ['Azione'], 4), // DLC
    app(4, ['Azione', 'GDR']),
    app(5, ['GDR']),
  ];

  function service() {
    const days = {
      createQueryBuilder: () => ({
        select: function () { return this; },
        orderBy: function () { return this; },
        limit: function () { return this; },
        getRawMany: async () => [{ Day: '2026-11-18' }],
      }),
      find: async () => APPS.map((a, i) => ({ Day: '2026-11-18', AppId: a.appId, Rank: i + 1 })),
    };
    const details = {
      get: vitest.fn(async (id: number) => APPS.find((a) => a.appId === id) ?? null),
      getMany: vitest.fn(async (ids: number[]) => ids.map((id) => APPS.find((a) => a.appId === id)!)),
    };
    const charts = new SteamChartsService(days as never, details as never);
    // Pretend today's chart is already saved, so nothing is fetched from Steam.
    (charts as unknown as { lastSave: number }).lastSave = Date.now();
    return { charts, details };
  }

  it('keeps chart order and only the games of the genre, leaving out DLC', async () => {
    const { charts } = service();
    const games = await charts.topGames(6, 'azione');
    expect(games.map((g) => g.appId)).toEqual([1, 4]);
    expect(await charts.topGames(1, 'GDR')).toMatchObject([{ appId: 4 }]);
    expect(await charts.topGames(6, 'Sport')).toEqual([]);
  });

  it('counts the genres of the charted games, the most common first', async () => {
    const { charts } = service();
    expect(await charts.topGenres()).toEqual([
      { name: 'Azione', games: 2 },
      { name: 'GDR', games: 2 },
      { name: 'Free-to-Play', games: 1 },
      { name: 'Strategia', games: 1 },
    ]);
  });

  it('asks for the chart details once an hour, however many genres are opened', async () => {
    const { charts, details } = service();
    await Promise.all([charts.topGames(6, 'Azione'), charts.topGames(6, 'GDR'), charts.topGenres()]);
    expect(details.getMany).toHaveBeenCalledTimes(1);
  });

  it('without a genre gives the first games of the chart', async () => {
    const { charts, details } = service();
    expect((await charts.topGames(2)).map((g) => g.appId)).toEqual([1, 2]);
    expect(details.getMany).toHaveBeenCalledTimes(1);
  });
});
