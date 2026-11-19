import { useEffect, useRef, useState } from 'react'
import { MAX_FAVORITES, isAppIdList } from '../../../shared/favorites'
import { readPreference, removePreference, savePreference } from '../services/preferences'

const UNAVAILABLE = 'Preferiti non disponibili. Riprova più tardi.'

// The user's favourite games (Steam app ids), saved in the API's database through
// window.api.favorites. Favourites an older version kept on this device are moved there
// on the first load. Without the bridge (tests, a plain browser) they stay on the device.
// La pagina è rimontata con una key diversa quando cambia utente.
export function useFavorites(userId?: string): {
  favorites: number[]
  loading: boolean
  error: string
  toggleFavorite: (id: number) => void
} {
  const remote = window.api?.favorites
  const key = 'bi.favorites.' + userId
  const [favorites, setFavorites] = useState<number[]>(() =>
    userId && !remote ? readPreference(key, [], isAppIdList) : []
  )
  const [loading, setLoading] = useState(!!(userId && remote))
  const [error, setError] = useState('')
  // Replies can arrive out of order: only the latest request may replace the list.
  const latest = useRef(0)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    if (!userId || !remote) return
    const request = ++latest.current
    const local = readPreference(key, [], isAppIdList).slice(0, MAX_FAVORITES)
    ;(local.length ? remote.add(local) : remote.list())
      .then((reply) => {
        if (!mounted.current || request !== latest.current) return
        if (!reply.ok) return setError(reply.message)
        setFavorites(reply.data)
        setError('')
        // Now on the server: the copy on this device is no longer needed.
        if (local.length) removePreference(key)
      })
      .catch(() => mounted.current && setError(UNAVAILABLE))
      .finally(() => mounted.current && setLoading(false))
  }, [userId, remote, key])

  const toggleFavorite = (id: number): void => {
    if (!userId) return
    const adding = !favorites.includes(id)
    const apply = (list: number[]): number[] =>
      adding ? [...list.filter((item) => item !== id), id] : list.filter((item) => item !== id)
    const undo = (list: number[]): number[] =>
      adding ? list.filter((item) => item !== id) : [...list.filter((item) => item !== id), id]

    if (!remote) {
      const next = apply(favorites)
      const result = savePreference(key, next)
      setError(result.ok ? '' : result.message)
      if (result.ok) setFavorites(next)
      return
    }

    // The heart changes at once; it goes back if the server refuses.
    setFavorites(apply)
    const request = ++latest.current
    ;(adding ? remote.add([id]) : remote.remove(id))
      .then((reply) => {
        if (!mounted.current) return
        if (!reply.ok) {
          setFavorites(undo)
          setError(reply.message)
        } else if (request === latest.current) {
          setFavorites(reply.data)
          setError('')
        }
      })
      .catch(() => {
        if (!mounted.current) return
        setFavorites(undo)
        setError(UNAVAILABLE)
      })
  }

  return { favorites, loading, error, toggleFavorite }
}
