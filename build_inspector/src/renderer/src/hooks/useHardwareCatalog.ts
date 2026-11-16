import { useCallback, useEffect, useState } from 'react'
import type { HardwareCatalog, HardwareCatalogReply } from '@shared/types/hardware'

interface HardwareCatalogState {
  catalog: HardwareCatalog | null
  loading: boolean
  error: string | null
  retry: () => void
}

// Shared by every page in this app run; dropped after a failure so retry asks again.
let request: Promise<HardwareCatalogReply> | null = null

export function resetHardwareCatalogCache(): void {
  request = null
}

// Every CPU and GPU from the API (window.api.hardware, see preload/index.ts).
export function useHardwareCatalog(): HardwareCatalogState {
  const hardware = window.api?.hardware
  const [round, setRound] = useState(0)
  const [result, setResult] = useState<{
    round: number
    catalog: HardwareCatalog | null
    error: string | null
  }>({ round: -1, catalog: null, error: null })

  useEffect(() => {
    if (!hardware) return
    let cancelled = false
    request ??= hardware.catalog()
    const current = request
    current
      .then((reply) => {
        if (!reply.ok && request === current) request = null
        if (!cancelled)
          setResult(
            reply.ok
              ? { round, catalog: reply.data, error: null }
              : { round, catalog: null, error: reply.message }
          )
      })
      .catch(() => {
        if (request === current) request = null
        if (!cancelled)
          setResult({ round, catalog: null, error: 'Elenco dei componenti non disponibile.' })
      })
    return () => {
      cancelled = true
    }
  }, [hardware, round])

  const retry = useCallback(() => setRound((n) => n + 1), [])

  if (!hardware)
    return {
      catalog: null,
      loading: false,
      error: 'L’elenco dei componenti è disponibile solo nell’app desktop.',
      retry
    }
  const current = result.round === round
  return {
    catalog: result.catalog,
    loading: !current,
    error: current ? result.error : null,
    retry
  }
}
