// One match from GET /steam/games/search?q= on the API.
export interface SteamSearchResult {
  appId: number
  name: string
}

export type SteamSearchReply =
  { ok: true; data: SteamSearchResult[] } | { ok: false; message: string }

// One line of a game's minimum requirements, as plain text.
export type RequirementKind = 'os' | 'cpu' | 'ram' | 'gpu' | 'storage' | 'directx' | 'other'
export interface RequirementRow {
  kind: RequirementKind
  label: string // Steam's own label, e.g. "Processore"; empty for unlabelled notes
  value: string
}

// A game's minimum PC requirements from Steam (GET /steam/games/:appId on the API).
export interface GameRequirements {
  appId: number
  name: string
  minimum: RequirementRow[] // empty when Steam lists none
  ramGb: number | null
  storageGb: number | null
}

export type GameRequirementsReply =
  { ok: true; data: GameRequirements } | { ok: false; message: string }

// One of the most played games on Steam over the last 7 days (GET /steam/games/top).
export interface TopGame {
  appId: number
  name: string
  description: string
  genres: string[]
  image: string // the cover on Steam's CDN
}

export type TopGamesReply = { ok: true; data: TopGame[] } | { ok: false; message: string }

// What the preload exposes to the renderer as window.api.steam.
export interface SteamApi {
  search(term: string): Promise<SteamSearchReply>
  requirements(appId: number): Promise<GameRequirementsReply>
  top(): Promise<TopGamesReply>
}
