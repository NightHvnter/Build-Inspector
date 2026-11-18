import { useEffect, useState, type JSX } from 'react'
import { Alert, Box, Container, Snackbar, type PaletteMode } from '@mui/material'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppLayout({
  mode,
  toggleTheme
}: {
  mode: PaletteMode
  toggleTheme: () => void
}): JSX.Element {
  const { signOut, sessionError } = useAuth()
  const [error, setError] = useState('')
  const { pathname } = useLocation()
  const navigate = useNavigate()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  const logout = async (): Promise<void> => {
    const result = await signOut()
    if (result.ok) navigate('/home', { replace: true })
    else setError(result.message)
  }
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar
        onLogout={() => {
          void logout()
        }}
      />
      <Box sx={{ ml: { md: '210px' }, minWidth: 0 }}>
        <Topbar mode={mode} toggleTheme={toggleTheme} />
        <Container component="main" maxWidth="lg" sx={{ py: 4 }}>
          {sessionError && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              {sessionError}
            </Alert>
          )}
          <Outlet />
        </Container>
      </Box>
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')}>
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  )
}
