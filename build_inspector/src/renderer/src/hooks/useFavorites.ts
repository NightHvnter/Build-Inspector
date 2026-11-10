import { useState } from 'react'
import { STEAM_GAMES } from '../games'
import { readPreference, savePreference } from '../services/preferences'

function isFavorites(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((id) => STEAM_GAMES.some((game) => game.id === id))
}

// La pagina è rimontata con una key diversa quando cambia utente.
export function useFavorites(userId?: string): {
  favorites: number[]
  error: string
  toggleFavorite: (id: number) => void
} {
  const key = 'bi.favorites.' + userId
  const [favorites, setFavorites] = useState<number[]>(() =>
    userId ? readPreference(key, [], isFavorites) : []
  )
  const [error, setError] = useState('')
  const toggleFavorite = (id: number): void => {
    if (!userId) return
    const next = favorites.includes(id)
      ? favorites.filter((item) => item !== id)
      : [...favorites, id]
    const result = savePreference(key, next)
    setError(result.ok ? '' : result.message)
    if (result.ok) setFavorites(next)
  }
  return { favorites, error, toggleFavorite }
}
