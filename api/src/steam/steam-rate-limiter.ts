import { Injectable } from '@nestjs/common';

// store.steampowered.com (appdetails) allows roughly 200 requests every 5 minutes per IP;
// the Web API (api.steampowered.com) is far more generous. Stay well below both.
export const LIMITS = {
  store: { max: 100, windowMs: 5 * 60 * 1000 },
  webapi: { max: 60, windowMs: 5 * 60 * 1000 },
} as const;
// After a 429, Steam is left alone for this long.
export const BACKOFF_MS = 5 * 60 * 1000;

export type SteamHost = keyof typeof LIMITS;

// Counts the requests sent to Steam in a sliding window. Callers that get "no" use what
// is already in the database instead of waiting.
@Injectable()
export class SteamRateLimiter {
  private readonly sent: Record<SteamHost, number[]> = {
    store: [],
    webapi: [],
  };
  private readonly pausedUntil: Record<SteamHost, number> = {
    store: 0,
    webapi: 0,
  };

  // True, and counted, when a request to `host` may go out now.
  take(host: SteamHost, now = Date.now()): boolean {
    if (now < this.pausedUntil[host]) return false;
    const { max, windowMs } = LIMITS[host];
    const recent = this.sent[host].filter((at) => now - at < windowMs);
    this.sent[host] = recent;
    if (recent.length >= max) return false;
    recent.push(now);
    return true;
  }

  // Steam answered 429 (too many requests): stop asking it for a while.
  rateLimited(host: SteamHost, now = Date.now()): void {
    this.pausedUntil[host] = now + BACKOFF_MS;
  }
}
