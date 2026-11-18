import { parseGameDetails, rankOverDays, type ChartRow } from '../steam/steam-charts.service.js';

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

describe('parseGameDetails', () => {
  const GAME = {
    type: 'game',
    name: 'Counter-Strike 2 ',
    short_description: 'Per oltre due decenni, <b>Counter-Strike</b> &egrave; &quot;competitivo&quot;.',
    genres: [
      { id: '1', description: 'Azione' },
      { id: '37', description: 'Free-to-Play' },
    ],
    header_image: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/730/header.jpg?t=1',
  };

  it('keeps the name, plain-text description, genres and cover of a game', () => {
    expect(parseGameDetails(GAME)).toEqual({
      name: 'Counter-Strike 2',
      description: 'Per oltre due decenni, Counter-Strike è "competitivo".',
      genres: ['Azione', 'Free-to-Play'],
      image: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/730/header.jpg?t=1',
    });
  });

  it('leaves out tools, DLC and covers from elsewhere', () => {
    // Wallpaper Engine is "type: game" on Steam, but in software genres.
    expect(
      parseGameDetails({ ...GAME, name: 'Wallpaper Engine', genres: [{ id: '4' }, { id: '51' }, { id: '53' }] }),
    ).toBeNull();
    expect(parseGameDetails({ ...GAME, type: 'dlc' })).toBeNull();
    expect(parseGameDetails({ ...GAME, header_image: 'https://evil.example/header.jpg' })).toBeNull();
    expect(parseGameDetails(null)).toBeNull();
  });
});
