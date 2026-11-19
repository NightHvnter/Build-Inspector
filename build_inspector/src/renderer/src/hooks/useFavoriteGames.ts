import { useEffect, useState } from 'react'
import { MAX_DETAILS_IDS } from '@shared/types/steam'
import { toGame, type Game } from '../games'

// Games already loaded during this app run, by Steam app id. The API caches Steam's
// answers too; this saves the round trip when the favourites page is opened again.
const loaded = new Map<number, Game>()
// Ids Steam answered for with nothing (removed from the store): not asked again this run.
const unknown = new Set<number>()

export function resetFavoriteGamesCache(): void {
  loaded.clear()
  unknown.clear()
}

interface FavoriteGamesState {
  games: Game[] // in the order of the ids; games Steam doesn't know are left out
  loading: boolean
  error: string | null
}

// The favourite games' cards, loaded by id through the API (window.api.steam.details).
export function useFavoriteGames(appIds: number[], enabled: boolean): FavoriteGamesState {
  const steam = window.api?.steam
  const active = enabled && !!steam?.details
  const missing = appIds.filter((id) => !loaded.has(id) && !unknown.has(id))
  // A string key, so a new array with the same ids doesn't load them again.
  const missingKey = missing.join(',')
  const [state, setState] = useState<{ key: string; error: string | null } | null>(null)

  useEffect(() => {
    if (!active || !steam || !missingKey) return
    let cancelled = false
    const ids = missingKey.split(',').map(Number)
    const chunks: number[][] = []
    for (let i = 0; i < ids.length; i += MAX_DETAILS_IDS)
      chunks.push(ids.slice(i, i + MAX_DETAILS_IDS))
    Promise.all(chunks.map((chunk) => steam.details(chunk)))
      .then((replies) => {
        const failed = replies.find((reply) => !reply.ok)
        replies.forEach((reply, index) => {
          if (!reply.ok) return
          for (const game of reply.data) loaded.set(game.appId, toGame(game))
          for (const id of chunks[index]) if (!loaded.has(id)) unknown.add(id)
        })
        if (!cancelled)
          setState({ key: missingKey, error: failed && !failed.ok ? failed.message : null })
      })
      .catch(() => {
        if (!cancelled) setState({ key: missingKey, error: 'Dettagli dei giochi non disponibili.' })
      })
    return () => {
      cancelled = true
    }
  }, [active, steam, missingKey])

  const done = !missingKey || state?.key === missingKey
  return {
    games: appIds.flatMap((id) => loaded.get(id) ?? []),
    loading: active && !done,
    error: done && missingKey ? (state?.error ?? null) : null
  }
}
