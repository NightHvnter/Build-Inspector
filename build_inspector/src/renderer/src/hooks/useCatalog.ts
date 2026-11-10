import { useSearchParams } from 'react-router-dom'
import { STEAM_GAMES, type Game } from '../games'

interface CatalogState {
  games: Game[]
  genres: string[]
  search: string
  genre: string
  sort: string
  hasFilters: boolean
  updateFilters: (values: Record<string, string>) => void
  resetFilters: () => void
}
export function useCatalog(favorites: number[], favoritesOnly: boolean): CatalogState {
  const [params, setParams] = useSearchParams()
  const genres = ['Tutti i generi', ...new Set(STEAM_GAMES.flatMap((game) => game.genre))]
  const search = params.get('q') ?? ''
  const genre = genres.includes(params.get('genre') ?? '') ? params.get('genre')! : 'Tutti i generi'
  const sort = params.get('sort') === 'alphabetical' ? 'alphabetical' : 'featured'
  const games = STEAM_GAMES.filter(
    (game) =>
      (!favoritesOnly || favorites.includes(game.id)) &&
      (genre === 'Tutti i generi' || game.genre.includes(genre)) &&
      game.title.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())
  )
  if (sort === 'alphabetical') games.sort((a, b) => a.title.localeCompare(b.title))
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
    genres,
    search,
    genre,
    sort,
    hasFilters: !!search || genre !== 'Tutti i generi',
    updateFilters,
    resetFilters: () => updateFilters({ q: '', genre: '' })
  }
}
