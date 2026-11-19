import { useEffect, useState } from 'react'
import type { GameRequirements } from '@shared/types/steam'
interface RequirementsState {
  requirements: GameRequirements | null
  loading: boolean
  error: string | null
}

// Loads a game's minimum requirements from Steam through the API (window.api.steam).
export function useGameRequirements(appId: number | null): RequirementsState {
  const steam = window.api?.steam
  const active = appId !== null && !!steam?.requirements
  const [result, setResult] = useState<{
    appId: number | null
    requirements: GameRequirements | null
    error: string | null
  }>({ appId: null, requirements: null, error: null })

  useEffect(() => {
    if (!active || appId === null || !steam) return
    let cancelled = false
    steam
      .requirements(appId)
      .then((reply) => {
        if (cancelled) return
        setResult(
          reply.ok
            ? { appId, requirements: reply.data, error: null }
            : { appId, requirements: null, error: reply.message }
        )
      })
      .catch(() => {
        if (!cancelled)
          setResult({ appId, requirements: null, error: 'Requisiti non disponibili su Steam.' })
      })
    return () => {
      cancelled = true
    }
  }, [active, appId, steam])

  const current = active && result.appId === appId
  return {
    requirements: current ? result.requirements : null,
    loading: active && !current,
    error: current ? result.error : null
  }
}
