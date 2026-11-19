import { useEffect, useState } from 'react'
import type { TopGamesReply, TopGenresReply } from '@shared/types/steam'
import { toGame, type Game } from '../games'

interface TopGamesState {
  games: Game[] | null // null while loading or when the chart isn't available
  loading: boolean
}

// The chart changes once a day: ask once per app run for each genre (and again after a
// failure). The key '' is the chart with every genre.
const requests = new Map<string, Promise<TopGamesReply>>()
let genresRequest: Promise<TopGenresReply> | null = null

export function resetTopGamesCache(): void {
  requests.clear()
  genresRequest = null
}

// The most played games on Steam over the last 7 days (window.api.steam.top), or only
// those of one genre.
export function useTopGames(genre = ''): TopGamesState {
  const steam = window.api?.steam
  const active = !!steam?.top
  const [result, setResult] = useState<{ genre: string; games: Game[] | null } | null>(null)

  useEffect(() => {
    if (!active || !steam) return
    let cancelled = false
    let current = requests.get(genre)
    if (!current) {
      current = steam.top(genre || undefined)
      requests.set(genre, current)
    }
    const forget = (): void => {
      if (requests.get(genre) === current) requests.delete(genre)
    }
    current
      .then((reply) => {
        if (!reply.ok) forget()
        if (!cancelled)
          setResult({
            genre,
            games: reply.ok && (reply.data.length || genre) ? reply.data.map(toGame) : null
          })
      })
      .catch(() => {
        forget()
        if (!cancelled) setResult({ genre, games: null })
      })
    return () => {
      cancelled = true
    }
  }, [active, steam, genre])

  const done = result?.genre === genre
  return { games: done ? result.games : null, loading: active && !done }
}

// The genres of the week's charted games, the most common first; empty until known.
export function useTopGenres(): string[] {
  const steam = window.api?.steam
  const active = !!steam?.topGenres
  const [genres, setGenres] = useState<string[]>([])

  useEffect(() => {
    if (!active || !steam) return
    let cancelled = false
    genresRequest ??= steam.topGenres()
    const current = genresRequest
    current
      .then((reply) => {
        if (!reply.ok && genresRequest === current) genresRequest = null
        if (!cancelled && reply.ok) setGenres(reply.data)
      })
      .catch(() => {
        if (genresRequest === current) genresRequest = null
      })
    return () => {
      cancelled = true
    }
  }, [active, steam])

  return genres
}
