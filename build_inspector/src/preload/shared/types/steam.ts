// One match from GET /steam/games/search?q= on the API.
export interface SteamSearchResult {
  appId: number
  name: string
}

export type SteamSearchReply =
  { ok: true; data: SteamSearchResult[] } | { ok: false; message: string }

// What the preload exposes to the renderer as window.api.steam.
export interface SteamApi {
  search(term: string): Promise<SteamSearchReply>
}
