import { useSearchParams } from 'react-router-dom'
import type { Game } from '../games'
import { useFavoriteGames } from './useFavoriteGames'
import { useSteamSearch } from './useSteamSearch'
import { useTopGames, useTopGenres } from './useTopGames'
import { MAX_GENRE_LENGTH } from '@shared/types/steam'

const ALL_GENRES = 'Tutti i generi'
// Genre chips shown in the catalog: the most common ones in the week's chart.
const MAX_GENRE_CHIPS = 12

interface CatalogState {
  games: Game[]
  featured: Game[]
  steamResults: Game[]
  genres: string[]
  search: string
  genre: string
  sort: string
  hasFilters: boolean
  // True when the featured games are Steam's most played of the week.
  fromChart: boolean
  featuredLoading: boolean
  // Why the week's chart (or the favourites' details) couldn't be shown.
  featuredError: string | null
  catalogSize: number
  steamLoading: boolean
  steamError: string | null
  updateFilters: (values: Record<string, string>) => void
  resetFilters: () => void
}

export function useCatalog(favorites: number[], favoritesOnly: boolean): CatalogState {
  const [params, setParams] = useSearchParams()
  const requested = (params.get('genre') ?? '').trim().slice(0, MAX_GENRE_LENGTH)
  // In the catalog a genre asks the API for that genre's most played games, not just a
  // filter over the games already shown.
  const chartGenre = favoritesOnly ? '' : requested
  const top = useTopGames(chartGenre)
  const chart = useTopGames('')
  const chartGenres = useTopGenres()
  // On the favourites page, every saved game is loaded by its id, wherever it came from.
  const favoriteGames = useFavoriteGames(favorites, favoritesOnly)
  const source = favoritesOnly ? favoriteGames.games : (top.games ?? [])
  const featuredLoading = favoritesOnly ? favoriteGames.loading : top.loading
  const featuredError = favoritesOnly
    ? favoriteGames.error
    : !top.loading && !top.games
      ? chartGenre
        ? 'I giochi di questo genere non sono disponibili ora. Riprova più tardi.'
        : 'La classifica di Steam non è disponibile: cerca un gioco per nome.'
      : null
  const genreList = favoritesOnly
    ? source.flatMap((game) => game.genre)
    : chartGenres.length
      ? chartGenres.slice(0, MAX_GENRE_CHIPS)
      : (chart.games ?? []).flatMap((game) => game.genre)
  const genres = [ALL_GENRES, ...new Set([...genreList, ...(chartGenre ? [chartGenre] : [])])]
  const search = params.get('q') ?? ''
  const genre = genres.includes(requested) ? requested : ALL_GENRES
  const sort = params.get('sort') === 'alphabetical' ? 'alphabetical' : 'featured'
  const featured = source.filter(
    (game) =>
      (!favoritesOnly || favorites.includes(game.id)) &&
      // The API has already picked the genre's games (cards show only 3 genres each).
      (genre === ALL_GENRES || !!chartGenre || game.genre.includes(genre)) &&
      game.title.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())
  )
  // Steam results have no genres, so they only appear when no genre is selected.
  const steam = useSteamSearch(search, !favoritesOnly && genre === ALL_GENRES)
  const shown = new Set(featured.map((game) => game.id))
  const steamResults = steam.games.filter((game) => !shown.has(game.id))
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
    featuredLoading,
    featuredError,
    catalogSize: favoritesOnly ? source.length : (chart.games?.length ?? 0),
    steamLoading: steam.loading,
    steamError: steam.error,
    updateFilters,
    resetFilters: () => updateFilters({ q: '', genre: '' })
  }
}
