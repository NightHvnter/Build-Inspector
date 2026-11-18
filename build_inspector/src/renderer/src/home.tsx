import type { JSX } from 'react'
import { useAuth } from './hooks/useAuth'
import { PreRegistrazione } from './pre-registrazione'

// /home: the app's start page, explaining what it does and where to go next.
export function HomePage(): JSX.Element {
  const { user } = useAuth()
  return <PreRegistrazione isLoggedIn={!!user} />
}
