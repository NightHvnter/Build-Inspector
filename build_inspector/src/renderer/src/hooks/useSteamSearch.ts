import { useEffect, useState } from 'react'
import type { Game } from '../games'

const MIN_LENGTH = 2
const DELAY_MS = 350

// Steam serves every app's cover at this address (allowed by the page's CSP).
export function steamCover(appId: number): string {
  return `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`
}

// A Steam search match shown as a catalog card. Steam's search gives only id and name:
// genres and requirements are unknown until the API returns the game's details.
export function steamGame(appId: number, name: string): Game {
  return {
    id: appId,
    title: name,
    image: steamCover(appId),
    genre: [],
    description: 'Risultato della ricerca su Steam.',
    fromSteamSearch: true
  }
}

interface SteamSearchState {
  games: Game[]
  loading: boolean
  error: string | null
}

// Searches the Steam store through the API (window.api.steam, see preload/index.ts).
export function useSteamSearch(term: string, enabled: boolean): SteamSearchState {
  const q = term.trim()
  const steam = window.api?.steam
  const active = enabled && !!steam && q.length >= MIN_LENGTH
  const [result, setResult] = useState<{ q: string; games: Game[]; error: string | null }>({
    q: '',
    games: [],
    error: null
  })

  useEffect(() => {
    if (!active || !steam) return
    let cancelled = false
    const timer = setTimeout(() => {
      steam
        .search(q)
        .then((reply) => {
          if (cancelled) return
          setResult(
            reply.ok
              ? { q, games: reply.data.map((i) => steamGame(i.appId, i.name)), error: null }
              : { q, games: [], error: reply.message }
          )
        })
        .catch(() => {
          if (!cancelled) setResult({ q, games: [], error: 'Ricerca su Steam non riuscita.' })
        })
    }, DELAY_MS)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [active, steam, q])

  const current = active && result.q === q
  return {
    games: current ? result.games : [],
    loading: active && !current,
    error: current ? result.error : null
  }
}
