import { useCallback, useEffect, useState } from 'react'
import type { HistoryEntry } from '../../../shared/history'

interface HistoryState {
  entries: HistoryEntry[]
  loading: boolean
  error: string | null
  busy: boolean
  remove: (id: number) => void
  clear: () => void
  reload: () => void
}

// The signed-in user's comparison history, through window.api.history (see preload/index.ts).
export function useHistory(): HistoryState {
  const history = window.api?.history
  const [round, setRound] = useState(0)
  const [result, setResult] = useState<{
    round: number
    entries: HistoryEntry[]
    error: string | null
  }>({ round: -1, entries: [], error: null })
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    if (!history) return
    let cancelled = false
    history
      .list()
      .then((reply) => {
        if (cancelled) return
        setResult(
          reply.ok
            ? { round, entries: reply.data, error: null }
            : { round, entries: [], error: reply.message }
        )
      })
      .catch(() => {
        if (!cancelled) setResult({ round, entries: [], error: 'Cronologia non disponibile.' })
      })
    return () => {
      cancelled = true
    }
  }, [history, round])

  const reload = useCallback(() => setRound((n) => n + 1), [])

  const run = useCallback(
    (action: Promise<{ ok: boolean; message?: string }> | undefined, onDone: () => void) => {
      if (!action) return
      setBusy(true)
      setActionError(null)
      action
        .then((reply) => {
          if (reply.ok) onDone()
          else setActionError(reply.message ?? 'Operazione non riuscita.')
        })
        .catch(() => setActionError('Operazione non riuscita.'))
        .finally(() => setBusy(false))
    },
    []
  )

  const remove = (id: number): void =>
    run(history?.remove(id), () =>
      setResult((r) => ({ ...r, entries: r.entries.filter((entry) => entry.id !== id) }))
    )
  const clear = (): void => run(history?.clear(), () => setResult((r) => ({ ...r, entries: [] })))

  if (!history)
    return {
      entries: [],
      loading: false,
      error: 'La cronologia è disponibile solo nell’app desktop.',
      busy: false,
      remove,
      clear,
      reload
    }
  const current = result.round === round
  return {
    entries: result.entries,
    loading: !current,
    error: actionError ?? (current ? result.error : null),
    busy,
    remove,
    clear,
    reload
  }
}
