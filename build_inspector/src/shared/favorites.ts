import type { Result } from './auth'

// What the preload exposes to the renderer as window.api.favorites. Every call replies
// with the user's whole list of favourite Steam app ids, from the API's Favorite table.
export interface FavoritesApi {
  list(): Promise<Result<number[]>>
  add(appIds: number[]): Promise<Result<number[]>>
  remove(appId: number): Promise<Result<number[]>>
}

export const favoritesChannels = {
  list: 'favorites:list',
  add: 'favorites:add',
  remove: 'favorites:remove'
} as const

// Matches the API's limit (MAX_FAVORITES).
export const MAX_FAVORITES = 500

export const isAppId = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value > 0 && value <= 2147483647

export function isAppIdList(value: unknown): value is number[] {
  return Array.isArray(value) && value.length <= MAX_FAVORITES && value.every(isAppId)
}
