import { useCallback, useEffect, useRef, useState } from 'react'
import type { AuthService } from '../services/authService'
import type { AuthContextValue } from '../contexts/AuthContext'
import type { SignInRequest, SignUpRequest, User } from '../types/auth'
import type { Result } from '../services/result'
import { useLoading } from './useLoading'

// L'hook coordina le richieste; è il backend a decidere se autenticare l'utente.
export function useAuthController(service: AuthService): AuthContextValue {
  const [user, setUser] = useState<User | null>(null)
  const [initializing, setInitializing] = useState(true)
  const [sessionError, setSessionError] = useState('')
  const mounted = useRef(true)
  const { runWithLoading } = useLoading()

  useEffect(() => {
    mounted.current = true
    let active = true
    void runWithLoading(() => service.getSession(), 'Verifica della sessione…').then((result) => {
      if (!active) return
      setUser(result.ok ? result.data : null)
      setSessionError(result.ok ? '' : result.message)
      setInitializing(false)
    })
    return () => {
      active = false
      mounted.current = false
    }
  }, [service, runWithLoading])

  const signIn = useCallback(
    async (values: SignInRequest): Promise<Result<User>> => {
      const result = await runWithLoading(() => service.signIn(values), 'Accesso in corso…')
      if (result.ok && mounted.current) {
        setUser(result.data)
        setSessionError('')
      }
      return result
    },
    [service, runWithLoading]
  )

  const signUp = useCallback(
    (values: SignUpRequest) =>
      runWithLoading(() => service.signUp(values), 'Registrazione in corso…'),
    [service, runWithLoading]
  )

  const signOut = useCallback(async (): Promise<Result<null>> => {
    const result = await runWithLoading(() => service.signOut(), 'Uscita in corso…')
    if (result.ok && mounted.current) setUser(null)
    return result
  }, [service, runWithLoading])

  return {
    user,
    initializing,
    configured: service.configured,
    sessionError,
    signIn,
    signUp,
    signOut
  }
}
