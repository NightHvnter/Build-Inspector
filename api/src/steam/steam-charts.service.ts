import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { SteamChartDayEntity } from './chart-day.entity.js';

const CHART_URL = 'https://api.steampowered.com/ISteamChartsService/GetMostPlayedGames/v1/';
const DETAILS_URL = 'https://store.steampowered.com/api/appdetails';
const DAYS = 7;
// A game missing from a day's top 100 counts as just below it that day.
const MISSING_RANK = 101;
const SAVE_EVERY_MS = 6 * 60 * 60 * 1000;
const TOP_CACHE_MS = 60 * 60 * 1000;
const DETAILS_CACHE_MS = 24 * 60 * 60 * 1000;
// Steam's software genres (Animation & Modeling … Game Development): tools like Wallpaper
// Engine are "type: game" on Steam but carry these.
const SOFTWARE_GENRES = new Set(['51', '52', '53', '54', '55', '56', '57', '58', '59', '60']);

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

interface GameDetails {
  name: string;
  description: string;
  genres: string[];
  image: string;
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

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  // Accents found in Italian descriptions.
  agrave: 'à',
  egrave: 'è',
  eacute: 'é',
  igrave: 'ì',
  ograve: 'ò',
  ugrave: 'ù',
  Egrave: 'È',
  rsquo: '’',
  hellip: '…',
};

function plainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&(#\d+|[a-z]+);/gi, (entity, code: string) =>
      code[0] === '#'
        ? String.fromCodePoint(Number(code.slice(1)))
        : (ENTITIES[code] ?? ENTITIES[code.toLowerCase()] ?? entity),
    )
    .replace(/\s+/g, ' ')
    .trim();
}

// appdetails' data for one app, or null when it isn't a game people play (DLC, tools, videos).
export function parseGameDetails(data: unknown): GameDetails | null {
  if (typeof data !== 'object' || data === null) return null;
  const d = data as Record<string, unknown>;
  const genres = Array.isArray(d.genres) ? (d.genres as { id?: unknown; description?: unknown }[]) : [];
  if (d.type !== 'game' || genres.some((g) => SOFTWARE_GENRES.has(String(g.id)))) return null;
  if (typeof d.name !== 'string' || typeof d.header_image !== 'string') return null;
  const image = new URL(d.header_image);
  if (image.protocol !== 'https:' || !image.hostname.endsWith('.steamstatic.com')) return null;
  return {
    name: d.name.trim(),
    description: typeof d.short_description === 'string' ? plainText(d.short_description).slice(0, 300) : '',
    genres: genres.map((g) => g.description).filter((g): g is string => typeof g === 'string'),
    image: image.href,
  };
}

@Injectable()
export class SteamChartsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SteamChartsService.name);
  private timer: ReturnType<typeof setInterval> | undefined;
  private lastSave = 0;
  private top: { at: number; limit: number; games: TopGame[] } | null = null;
  private readonly details = new Map<number, { at: number; value: GameDetails | null }>();

  constructor(
    @InjectRepository(SteamChartDayEntity)
    private readonly days: Repository<SteamChartDayEntity>,
  ) {}

  onModuleInit(): void {
    const save = (): void => {
      this.saveLatestDay().catch((err) => this.logger.warn(`Steam chart not saved: ${err?.message ?? err}`));
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
    this.top = null;
    this.logger.log(`Saved Steam's most played games for ${day} (${rows.length})`);
  }

  // The most played games over the last 7 saved days.
  async topGames(limit = 6): Promise<TopGame[]> {
    if (this.top && this.top.limit === limit && Date.now() - this.top.at < TOP_CACHE_MS) return this.top.games;
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
    if (!days.length) return [];
    const rows = await this.days.find({ select: { Day: true, AppId: true, Rank: true }, where: { Day: In(days) } });

    const games: TopGame[] = [];
    for (const { appId, averageRank } of rankOverDays(rows, days)) {
      if (games.length >= limit) break;
      const details = await this.gameDetails(appId);
      if (details) games.push({ appId, ...details, averageRank, days: days.length });
    }
    this.top = { at: Date.now(), limit, games };
    return games;
  }

  private async gameDetails(appId: number): Promise<GameDetails | null> {
    const cached = this.details.get(appId);
    if (cached && Date.now() - cached.at < DETAILS_CACHE_MS) return cached.value;
    try {
      const url = `${DETAILS_URL}?appids=${appId}&l=italian`;
      const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
      const body = response.ok ? ((await response.json()) as Record<string, { data?: unknown }>) : {};
      const value = parseGameDetails(body[String(appId)]?.data);
      this.details.set(appId, { at: Date.now(), value });
      return value;
    } catch {
      return null; // Try again on the next request; don't remember a network failure.
    }
  }
}
