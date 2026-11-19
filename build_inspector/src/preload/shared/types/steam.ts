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

// A Steam game's card data: one of the week's most played (GET /steam/games/top) or a
// game asked for by id, e.g. a favourite (GET /steam/games/details?ids=).
export interface TopGame {
  appId: number
  name: string
  description: string
  genres: string[]
  image: string // the cover on Steam's CDN
}

export type TopGamesReply = { ok: true; data: TopGame[] } | { ok: false; message: string }

// The genres of the week's charted games, the most common first (GET /steam/games/top/genres).
export type TopGenresReply = { ok: true; data: string[] } | { ok: false; message: string }

// Longest genre name the API accepts.
export const MAX_GENRE_LENGTH = 50

// What the preload exposes to the renderer as window.api.steam.
export interface SteamApi {
  search(term: string): Promise<SteamSearchReply>
  requirements(appId: number): Promise<GameRequirementsReply>
  // With a genre: the most played games of that genre only.
  top(genre?: string): Promise<TopGamesReply>
  topGenres(): Promise<TopGenresReply>
  // At most MAX_DETAILS_IDS ids per call.
  details(appIds: number[]): Promise<TopGamesReply>
}

// Matches the API's limit on GET /steam/games/details.
export const MAX_DETAILS_IDS = 100
