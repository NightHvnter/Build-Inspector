import type { JSX } from 'react'
import { Box, Button, Typography, type PaletteMode } from '@mui/material'
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { ProtectedRoute } from './components/common/ProtectedRoute'
import { AuthPage } from './Login'
import { Library } from './library'
import { HomePage } from './home'
import { CompareGame } from './compare'
import { HistoryPage } from './history'
import { PostRegistrazione } from './post-registrazione'
import { useAuth } from './hooks/useAuth'

function LibraryRedirect(): JSX.Element {
  const { search } = useLocation()
  return <Navigate to={{ pathname: '/home', search }} replace />
}

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
        <Route index element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomePage key={'home-' + (user?.id ?? 'guest')} />} />
        {/* The catalog lives on the home now; old links keep their search and filters. */}
        <Route path="/libreria" element={<LibraryRedirect />} />
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
              <Button component={Link} to="/home">
                Torna alla home
              </Button>
            </Box>
          }
        />
      </Route>
    </Routes>
  )
}
