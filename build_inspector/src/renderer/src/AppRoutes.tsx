import type { JSX } from 'react'
import { Box, Button, Typography, type PaletteMode } from '@mui/material'
import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { ProtectedRoute } from './components/common/ProtectedRoute'
import { AuthPage } from './Login'
import { Library } from './library'
import { CompareGame } from './compare'
import { HistoryPage } from './history'
import { PostRegistrazione } from './post-registrazione'
import { useAuth } from './hooks/useAuth'

export function AppRoutes({
  mode,
  toggleTheme
}: {
  mode: PaletteMode
  toggleTheme: () => void
}): JSX.Element {
  const { user } = useAuth()
  return (
    <Routes>
      <Route element={<AppLayout mode={mode} toggleTheme={toggleTheme} />}>
        <Route index element={<Navigate to="/libreria" replace />} />
        <Route path="/libreria" element={<Library key={'catalog-' + (user?.id ?? 'guest')} />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/registrazione" element={<AuthPage mode="register" />} />
        <Route path="/recupera-password" element={<AuthPage mode="recovery" />} />
        <Route element={<ProtectedRoute />}>
          <Route
            path="/preferiti"
            element={<Library key={'favorites-' + user?.id} favoritesOnly />}
          />
          <Route
            path="/configurazione"
            element={user ? <PostRegistrazione key={user.id} userId={user.id} /> : null}
          />
          <Route path="/confronto/:appId" element={<CompareGame />} />
          <Route path="/cronologia" element={<HistoryPage key={user?.id} />} />
        </Route>
        <Route
          path="*"
          element={
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                Pagina non trovata
              </Typography>
              <Button component={Link} to="/libreria">
                Torna alla libreria
              </Button>
            </Box>
          }
        />
      </Route>
    </Routes>
  )
}
