import { useSearchParams } from 'react-router-dom'
import { STEAM_GAMES, type Game } from '../games'
import { steamAppId } from './useGameRequirements'
import { useSteamSearch } from './useSteamSearch'
import { useTopGames } from './useTopGames'

const ALL_GENRES = 'Tutti i generi'

interface CatalogState {
  games: Game[]
  featured: Game[]
  steamResults: Game[]
  genres: string[]
  search: string
  genre: string
  sort: string
  hasFilters: boolean
  // True when the featured games are Steam's most played of the week (not the built-in list).
  fromChart: boolean
  featuredLoading: boolean
  catalogSize: number
  steamLoading: boolean
  steamError: string | null
  updateFilters: (values: Record<string, string>) => void
  resetFilters: () => void
}

// The same Steam game can come from the chart, the built-in list and a search.
function uniqueGames(games: Game[]): Game[] {
  const seen = new Set<number | string>()
  return games.filter((game) => {
    const key = steamAppId(game) ?? game.image
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function useCatalog(favorites: number[], favoritesOnly: boolean): CatalogState {
  const [params, setParams] = useSearchParams()
  const top = useTopGames()
  // The week's most played games, or the built-in list when the API can't give them.
  const featuredSource = top.games ?? (top.loading ? [] : STEAM_GAMES)
  // Favorites may come from either list.
  const source = favoritesOnly ? uniqueGames([...featuredSource, ...STEAM_GAMES]) : featuredSource
  const genres = [ALL_GENRES, ...new Set(source.flatMap((game) => game.genre))]
  const search = params.get('q') ?? ''
  const genre = genres.includes(params.get('genre') ?? '') ? params.get('genre')! : ALL_GENRES
  const sort = params.get('sort') === 'alphabetical' ? 'alphabetical' : 'featured'
  const featured = source.filter(
    (game) =>
      (!favoritesOnly || favorites.includes(game.id)) &&
      (genre === ALL_GENRES || game.genre.includes(genre)) &&
      game.title.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())
  )
  // Steam results have no genres, so they only appear when no genre is selected.
  const steam = useSteamSearch(search, !favoritesOnly && genre === ALL_GENRES)
  const shown = new Set(featured.map((game) => steamAppId(game) ?? game.image))
  const steamResults = steam.games.filter((game) => !shown.has(steamAppId(game) ?? game.image))
  if (sort === 'alphabetical')
    for (const list of [featured, steamResults]) list.sort((a, b) => a.title.localeCompare(b.title))
  const games = [...featured, ...steamResults]
  const updateFilters = (values: Record<string, string>): void => {
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        Object.entries(values).forEach(([key, value]) => {
          if (value) next.set(key, value)
          else next.delete(key)
        })
        return next
      },
      { replace: true }
    )
  }
  return {
    games,
    featured,
    steamResults,
    genres,
    search,
    genre,
    sort,
    hasFilters: !!search || genre !== ALL_GENRES,
    fromChart: !!top.games,
    featuredLoading: top.loading,
    catalogSize: featuredSource.length,
    steamLoading: steam.loading,
    steamError: steam.error,
    updateFilters,
    resetFilters: () => updateFilters({ q: '', genre: '' })
  }
}
