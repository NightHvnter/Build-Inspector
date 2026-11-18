import { useEffect, useState } from 'react'
import type { TopGame, TopGamesReply } from '@shared/types/steam'
import type { Game } from '../games'

// A most-played game as a catalog card. Requirements come from Steam when the game is opened.
export function topGame(game: TopGame): Game {
  return {
    id: game.appId,
    title: game.name,
    image: game.image,
    genre: game.genres.slice(0, 3),
    description: game.description,
    reqCpu: '',
    reqGpu: '',
    reqRam: 0,
    baseFps: 0
  }
}

interface TopGamesState {
  games: Game[] | null // null while loading or when the chart isn't available
  loading: boolean
}

// The chart changes once a day: ask once per app run (and again after a failure).
let request: Promise<TopGamesReply> | null = null

export function resetTopGamesCache(): void {
  request = null
}

// The most played games on Steam over the last 7 days (window.api.steam.top).
export function useTopGames(): TopGamesState {
  const steam = window.api?.steam
  const active = !!steam?.top
  const [result, setResult] = useState<{ done: boolean; games: Game[] | null }>({
    done: false,
    games: null
  })

  useEffect(() => {
    if (!active || !steam) return
    let cancelled = false
    request ??= steam.top()
    const current = request
    current
      .then((reply) => {
        if (!reply.ok && request === current) request = null
        if (!cancelled)
          setResult({
            done: true,
            games: reply.ok && reply.data.length ? reply.data.map(topGame) : null
          })
      })
      .catch(() => {
        if (request === current) request = null
        if (!cancelled) setResult({ done: true, games: null })
      })
    return () => {
      cancelled = true
    }
  }, [active, steam])

  return { games: result.games, loading: active && !result.done }
}
