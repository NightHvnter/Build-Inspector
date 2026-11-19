import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { SteamGameEntity } from './steam-game.entity.js';
import { SteamRateLimiter } from './steam-rate-limiter.js';

const ITEMS_URL =
  'https://api.steampowered.com/IStoreBrowseService/GetItems/v1/';
const TAGS_URL = 'https://api.steampowered.com/IStoreService/GetTagList/v1/';
const ASSETS_BASE = 'https://shared.akamai.steamstatic.com/store_item_assets/';
// Card data is asked for again after a week; an unknown id after a day.
export const CARD_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const MISSING_TTL_MS = 24 * 60 * 60 * 1000;
const TAGS_TTL_MS = 24 * 60 * 60 * 1000;
// Apps per GetItems request (Steam accepts at least this many).
export const BATCH_SIZE = 100;
// Ids accepted in one GET /steam/games/details request.
export const MAX_IDS = 100;
// Tags kept per game, the most voted first.
const MAX_TAGS = 10;
const GAME_TYPE = 0;
const UNKNOWN_APP = 15; // GetItems' "success" for an id Steam doesn't know

// What a catalog card needs to show a Steam app. `genres` are Steam's community tags.
export interface GameSummary {
  appId: number;
  name: string;
  description: string;
  genres: string[];
  image: string;
}

export interface AppSummary extends GameSummary {
  type: number;
}

// A game people play, as opposed to DLC, soundtracks or software.
export function isPlayableGame(app: AppSummary): boolean {
  return app.type === GAME_TYPE;
}

export function toGameSummary({
  appId,
  name,
  description,
  genres,
  image,
}: AppSummary): GameSummary {
  return { appId, name, description, genres, image };
}

// "730,570,abc,730" → [730, 570]: valid Steam app ids, without repeats, at most MAX_IDS.
export function parseIds(value: string | undefined): number[] {
  const ids = new Set<number>();
  for (const part of (value ?? '').split(',')) {
    const id = Number(part.trim());
    if (
      /^\d{1,10}$/.test(part.trim()) &&
      Number.isSafeInteger(id) &&
      id > 0 &&
      id <= 2147483647
    )
      ids.add(id);
    if (ids.size >= MAX_IDS) break;
  }
  return [...ids];
}

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
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

export function plainText(html: string): string {
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

// One GetItems store item as a SteamGame row, or null when the answer can't be used.
export function parseStoreItem(
  item: unknown,
  now: Date,
): Partial<SteamGameEntity> | null {
  if (typeof item !== 'object' || item === null) return null;
  const i = item as Record<string, any>;
  // `id` is the id asked for; `appid` is 0 when Steam doesn't know it.
  const appId = Number(i.id || i.appid);
  if (!Number.isSafeInteger(appId) || appId <= 0) return null;
  if (i.success === UNKNOWN_APP)
    return { AppId: appId, Found: false, UpdatedAt: now };
  if (i.success !== 1 || typeof i.name !== 'string' || !i.name.trim())
    return null;

  const tags =
    Array.isArray(i.tags) && i.tags.length
      ? [...i.tags]
          .filter((t) => Number.isSafeInteger(t?.tagid))
          .sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0))
          .map((t) => t.tagid as number)
      : (Array.isArray(i.tagids) ? i.tagids : []).filter((t: unknown) =>
          Number.isSafeInteger(t),
        );

  // asset_url_format is "steam/apps/<id>/${FILENAME}?t=…"; only Steam's own paths are used.
  const format =
    typeof i.assets?.asset_url_format === 'string'
      ? i.assets.asset_url_format
      : '';
  const header = typeof i.assets?.header === 'string' ? i.assets.header : '';
  const image =
    format.startsWith(`steam/apps/${appId}/`) &&
    /^[\w./-]+$/.test(header) &&
    !header.includes('..')
      ? ASSETS_BASE + format.replace('${FILENAME}', header)
      : `${ASSETS_BASE}steam/apps/${appId}/header.jpg`;

  const description =
    typeof i.basic_info?.short_description === 'string'
      ? i.basic_info.short_description
      : '';
  return {
    AppId: appId,
    Found: true,
    Type: Number.isSafeInteger(i.type) ? i.type : -1,
    Name: i.name.trim().slice(0, 255),
    Description: plainText(description).slice(0, 300),
    TagIds: tags.slice(0, MAX_TAGS),
    ImageUrl: image,
    UpdatedAt: now,
  };
}

function isFresh(row: SteamGameEntity, now: number): boolean {
  if (!row.UpdatedAt) return false;
  return (
    now - new Date(row.UpdatedAt).getTime() <
    (row.Found ? CARD_TTL_MS : MISSING_TTL_MS)
  );
}

// Steam apps' card data, kept in the SteamGame table. Missing or week-old rows are asked
// for in batches of 100 through GetItems; when Steam can't be asked (rate limit, outage)
// the rows already saved are used as they are.
@Injectable()
export class SteamDetailsService {
  private readonly logger = new Logger(SteamDetailsService.name);
  private readonly pending = new Map<number, Promise<void>>();
  private tags: { at: number; names: Map<number, string> } | null = null;
  private tagsPending: Promise<Map<number, string>> | null = null;

  constructor(
    @InjectRepository(SteamGameEntity)
    private readonly games: Repository<SteamGameEntity>,
    private readonly limiter: SteamRateLimiter,
  ) {}

  async get(appId: number): Promise<AppSummary | null> {
    return (await this.getMany([appId]))[0] ?? null;
  }

  // The apps Steam knows, in the order asked.
  async getMany(appIds: number[]): Promise<AppSummary[]> {
    const ids = [...new Set(appIds)];
    if (!ids.length) return [];
    const now = Date.now();
    const saved = await this.games.findBy({ AppId: In(ids) });
    const stale = ids.filter((id) => {
      const row = saved.find((r) => r.AppId === id);
      return !row || !isFresh(row, now);
    });
    let rows = saved;
    if (stale.length) {
      await this.refresh(stale);
      rows = await this.games.findBy({ AppId: In(ids) });
    }
    const names = await this.tagNames();
    const byId = new Map(rows.map((row) => [row.AppId, row]));
    return ids.flatMap((id) => {
      const row = byId.get(id);
      return row?.Found ? [toSummary(row, names)] : [];
    });
  }

  // Asks Steam for these apps, sharing requests already on their way.
  private async refresh(appIds: number[]): Promise<void> {
    const waiting = appIds.flatMap((id) => this.pending.get(id) ?? []);
    const fresh = appIds.filter((id) => !this.pending.has(id));
    const batches: Promise<void>[] = [];
    for (let i = 0; i < fresh.length; i += BATCH_SIZE) {
      const batch = fresh.slice(i, i + BATCH_SIZE);
      const request = this.fetchBatch(batch).finally(() =>
        batch.forEach((id) => this.pending.delete(id)),
      );
      batch.forEach((id) => this.pending.set(id, request));
      batches.push(request);
    }
    await Promise.all([...waiting, ...batches]);
  }

  private async fetchBatch(appIds: number[]): Promise<void> {
    if (!this.limiter.take('webapi')) return;
    const input = {
      ids: appIds.map((appid) => ({ appid })),
      context: { language: 'italian', country_code: 'IT' },
      data_request: {
        include_basic_info: true,
        include_tag_count: MAX_TAGS,
        include_assets: true,
      },
    };
    try {
      const url = `${ITEMS_URL}?input_json=${encodeURIComponent(JSON.stringify(input))}`;
      const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (response.status === 429) return this.limiter.rateLimited('webapi');
      if (!response.ok) return;
      const body = (await response.json()) as {
        response?: { store_items?: unknown[] };
      };
      const now = new Date();
      const rows = (body.response?.store_items ?? [])
        .map((item) => parseStoreItem(item, now))
        .filter((row): row is Partial<SteamGameEntity> => row !== null);
      if (rows.length) await this.games.upsert(rows, ['AppId']);
    } catch (err) {
      // Network failure: keep what is saved and try again on the next request.
      this.logger.warn(
        `Steam games not updated: ${(err as Error)?.message ?? err}`,
      );
    }
  }

  // Steam's tag names in Italian, by id: one request a day.
  private async tagNames(): Promise<Map<number, string>> {
    if (this.tags && Date.now() - this.tags.at < TAGS_TTL_MS)
      return this.tags.names;
    this.tagsPending ??= (async () => {
      const old = this.tags?.names ?? new Map<number, string>();
      if (!this.limiter.take('webapi')) return old;
      try {
        const response = await fetch(`${TAGS_URL}?language=italian`, {
          signal: AbortSignal.timeout(15000),
        });
        if (response.status === 429) this.limiter.rateLimited('webapi');
        if (!response.ok) return old;
        const body = (await response.json()) as {
          response?: { tags?: { tagid?: unknown; name?: unknown }[] };
        };
        const names = new Map<number, string>();
        for (const tag of body.response?.tags ?? [])
          if (Number.isSafeInteger(tag.tagid) && typeof tag.name === 'string')
            names.set(tag.tagid as number, tag.name);
        if (names.size) this.tags = { at: Date.now(), names };
        return names.size ? names : old;
      } catch {
        return old;
      }
    })().finally(() => {
      this.tagsPending = null;
    });
    return this.tagsPending;
  }
}

function toSummary(
  row: SteamGameEntity,
  names: Map<number, string>,
): AppSummary {
  return {
    appId: row.AppId,
    type: row.Type,
    name: row.Name,
    description: row.Description,
    genres: (row.TagIds ?? []).flatMap((id) => names.get(id) ?? []),
    image: row.ImageUrl || `${ASSETS_BASE}steam/apps/${row.AppId}/header.jpg`,
  };
}
