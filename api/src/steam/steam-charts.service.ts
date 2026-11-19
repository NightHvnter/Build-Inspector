import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { SteamChartDayEntity } from './chart-day.entity.js';
import {
  SteamDetailsService,
  isPlayableGame,
  type AppSummary,
} from './steam-details.service.js';

const CHART_URL = 'https://api.steampowered.com/ISteamChartsService/GetMostPlayedGames/v1/';
const DAYS = 7;
// A game missing from a day's top 100 counts as just below it that day.
const MISSING_RANK = 101;
const SAVE_EVERY_MS = 6 * 60 * 60 * 1000;
const TOP_CACHE_MS = 60 * 60 * 1000;
// Charted games looked at: a week of daily top 100s rarely has more. Their card data comes
// from the SteamGame table, refreshed through GetItems in 2 requests when needed.
export const RANKED_MAX = 150;
// Tags counted per game for the genre chips: the most voted ones describe it best.
const TAGS_COUNTED = 5;

export interface GenreCount {
  name: string;
  games: number; // how many charted games carry it
}

export interface ChartRow {
  Day: string;
  AppId: number;
  Rank: number;
}

export interface TopGame {
  appId: number;
  name: string;
  description: string;
  genres: string[];
  image: string;
  averageRank: number; // over the days counted, missing days as 101
  days: number; // how many saved days the ranking covers (at most 7)
}

// Games ordered by their average daily rank over the given days, best first.
export function rankOverDays(rows: ChartRow[], days: string[]): { appId: number; averageRank: number }[] {
  const ranks = new Map<number, Map<string, number>>();
  for (const row of rows) {
    if (!days.includes(row.Day)) continue;
    if (!ranks.has(row.AppId)) ranks.set(row.AppId, new Map());
    ranks.get(row.AppId)!.set(row.Day, row.Rank);
  }
  const latest = days[0];
  return [...ranks]
    .map(([appId, byDay]) => ({
      appId,
      averageRank: days.reduce((sum, day) => sum + (byDay.get(day) ?? MISSING_RANK), 0) / days.length,
      latestRank: byDay.get(latest) ?? MISSING_RANK,
    }))
    .sort((a, b) => a.averageRank - b.averageRank || a.latestRank - b.latestRank)
    .map(({ appId, averageRank }) => ({ appId, averageRank: Math.round(averageRank * 10) / 10 }));
}

@Injectable()
export class SteamChartsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SteamChartsService.name);
  private timer: ReturnType<typeof setInterval> | undefined;
  private lastSave = 0;
  private ranked: { at: number; games: TopGame[] } | null = null;
  private rankedPending: Promise<TopGame[]> | null = null;

  constructor(
    @InjectRepository(SteamChartDayEntity)
    private readonly days: Repository<SteamChartDayEntity>,
    private readonly details: SteamDetailsService,
  ) {}

  onModuleInit(): void {
    const save = (): void => {
      this.saveLatestDay()
        .catch((err) => this.logger.warn(`Steam chart not saved: ${err?.message ?? err}`))
        // Fill the details cache in the background, so the first genre filter is quick.
        .then(() => this.rankedGames())
        .catch((err) => this.logger.warn(`Steam chart details not loaded: ${err?.message ?? err}`));
    };
    save();
    this.timer = setInterval(save, SAVE_EVERY_MS);
    this.timer.unref?.();
  }

  onModuleDestroy(): void {
    clearInterval(this.timer);
  }

  // Saves Steam's latest daily chart, once per day.
  async saveLatestDay(): Promise<void> {
    const response = await fetch(CHART_URL, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const chart = ((await response.json()) as { response?: { rollup_date?: unknown; ranks?: unknown } }).response;
    if (typeof chart?.rollup_date !== 'number' || !Array.isArray(chart.ranks)) throw new Error('Unexpected chart');
    const day = new Date(chart.rollup_date * 1000).toISOString().slice(0, 10);
    this.lastSave = Date.now();
    if (await this.days.exists({ where: { Day: day } })) return;
    const rows = (chart.ranks as Record<string, unknown>[])
      .filter((r) => Number.isSafeInteger(r.appid) && Number.isSafeInteger(r.rank))
      .map((r) => ({
        Day: day,
        AppId: r.appid as number,
        Rank: r.rank as number,
        PeakPlayers: Number.isSafeInteger(r.peak_in_game) ? (r.peak_in_game as number) : 0,
      }));
    await this.days.createQueryBuilder().insert().values(rows).orIgnore().execute();
    this.ranked = null;
    this.logger.log(`Saved Steam's most played games for ${day} (${rows.length})`);
  }

  // The most played games over the last 7 saved days; with a genre, only the games that
  // carry that tag (Steam's Italian names, e.g. "GDR"), still in chart order.
  async topGames(limit = 6, genre?: string): Promise<TopGame[]> {
    const games = await this.rankedGames();
    if (!genre) return games.slice(0, limit);
    const wanted = genre.trim().toLocaleLowerCase('it');
    return games.filter((game) => game.genres.some((g) => g.toLocaleLowerCase('it') === wanted)).slice(0, limit);
  }

  // The genres of the charted games, the most common first.
  async topGenres(): Promise<GenreCount[]> {
    const counts = new Map<string, number>();
    for (const game of await this.rankedGames())
      for (const genre of new Set(game.genres.slice(0, TAGS_COUNTED))) counts.set(genre, (counts.get(genre) ?? 0) + 1);
    return [...counts]
      .map(([name, games]) => ({ name, games }))
      .sort((a, b) => b.games - a.games || a.name.localeCompare(b.name, 'it'));
  }

  // Every playable game in the last 7 days' charts (at most RANKED_MAX), best first. Built
  // once an hour from the SteamGame table.
  private rankedGames(): Promise<TopGame[]> {
    if (this.ranked && Date.now() - this.ranked.at < TOP_CACHE_MS) return Promise.resolve(this.ranked.games);
    this.rankedPending ??= (async () => {
      const { ranking, days } = await this.ranking();
      const shortlist = ranking.slice(0, RANKED_MAX);
      const rankOf = new Map(shortlist.map((row) => [row.appId, row.averageRank]));
      const apps = await this.details.getMany(shortlist.map((row) => row.appId));
      const games = apps.filter(isPlayableGame).map((app) => toTopGame(app, rankOf.get(app.appId)!, days));
      this.ranked = { at: Date.now(), games };
      return games;
    })().finally(() => {
      this.rankedPending = null;
    });
    return this.rankedPending;
  }

  private async ranking(): Promise<{ ranking: { appId: number; averageRank: number }[]; days: number }> {
    if (Date.now() - this.lastSave > SAVE_EVERY_MS)
      await this.saveLatestDay().catch((err) => this.logger.warn(`Steam chart not saved: ${err?.message ?? err}`));
    const days = (
      await this.days
        .createQueryBuilder('d')
        .select('DISTINCT d.Day', 'Day')
        .orderBy('d.Day', 'DESC')
        .limit(DAYS)
        .getRawMany<{ Day: string }>()
    ).map((row) => row.Day);
    if (!days.length) return { ranking: [], days: 0 };
    const rows = await this.days.find({ select: { Day: true, AppId: true, Rank: true }, where: { Day: In(days) } });
    return { ranking: rankOverDays(rows, days), days: days.length };
  }
}

function toTopGame(app: AppSummary, averageRank: number, days: number): TopGame {
  return {
    appId: app.appId,
    name: app.name,
    description: app.description,
    genres: app.genres,
    image: app.image,
    averageRank,
    days,
  };
}
