import { useCallback, useEffect, useRef, useState, type JSX, type ReactNode } from 'react'
import { LoadingContext } from '../contexts/LoadingContext'
import { safely, type Result } from '../services/result'

export function LoadingProvider({ children }: { children: ReactNode }): JSX.Element {
  const [pending, setPending] = useState<Record<number, string>>({})
  const nextId = useRef(0)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const runWithLoading = useCallback(
    async <T,>(
      operation: () => Promise<Result<T>>,
      message = 'Caricamento in corso…'
    ): Promise<Result<T>> => {
      const id = nextId.current++
      if (mounted.current) setPending((previous) => ({ ...previous, [id]: message }))
      try {
        return await safely(operation)
      } finally {
        // Ogni richiesta rimuove solo il proprio caricamento, anche in caso di errore.
        if (mounted.current)
          setPending((previous) => {
            const remaining = { ...previous }
            delete remaining[id]
            return remaining
          })
      }
    },
    []
  )

  const messages = Object.values(pending)
  return (
    <LoadingContext.Provider
      value={{
        isLoading: messages.length > 0,
        message: messages.at(-1) ?? '',
        runWithLoading
      }}
    >
      {children}
    </LoadingContext.Provider>
  )
}
