import { CircularProgress, Stack } from '@mui/material'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { JSX } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { authLink } from '../../utils/authNavigation'

// Questo controllo serve alla navigazione; il backend dovrà proteggere i propri dati.
export function ProtectedRoute(): JSX.Element {
  const { user, initializing } = useAuth()
  const { pathname } = useLocation()
  if (initializing)
    return (
      <Stack role="status" sx={{ alignItems: 'center' }}>
        <CircularProgress aria-label="Verifica sessione" />
      </Stack>
    )
  return user ? <Outlet /> : <Navigate to={authLink('/login', pathname)} replace />
}
