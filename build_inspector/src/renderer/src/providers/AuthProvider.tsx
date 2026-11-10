import type { JSX, ReactNode } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { useAuthController } from '../hooks/useAuthController'
import { authService, type AuthService } from '../services/authService'

export function AuthProvider({
  children,
  service = authService
}: {
  children: ReactNode
  service?: AuthService
}): JSX.Element {
  const auth = useAuthController(service)
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}
