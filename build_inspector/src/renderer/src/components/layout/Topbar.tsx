import {
  AppBar,
  Button,
  IconButton,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  type PaletteMode
} from '@mui/material'
import { Link, useLocation } from 'react-router-dom'
import type { JSX } from 'react'
import { Icon } from '../Icon'
import { useAuth } from '../../hooks/useAuth'

const titles: Record<string, string> = {
  '/home': 'Home',
  '/libreria': 'Libreria',
  '/cronologia': 'Cronologia',
  '/preferiti': 'Preferiti',
  '/configurazione': 'La mia build',
  '/login': 'Accedi',
  '/registrazione': 'Registrazione',
  '/recupera-password': 'Recupero password'
}

export function Topbar({
  mode,
  toggleTheme
}: {
  mode: PaletteMode
  toggleTheme: () => void
}): JSX.Element {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const authPage = ['/login', '/registrazione', '/recupera-password'].includes(pathname)
  return (
    <AppBar
      position="static"
      color="inherit"
      elevation={0}
      sx={{ borderBottom: 1, borderColor: 'divider' }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', gap: 1 }}>
        <Typography variant="body2">
          {titles[pathname] ??
            (pathname.startsWith('/confronto/') ? 'Confronto con il tuo PC' : 'Pagina non trovata')}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Tooltip title={mode === 'dark' ? 'Tema chiaro' : 'Tema scuro'}>
            <IconButton
              onClick={toggleTheme}
              aria-label={mode === 'dark' ? 'Attiva tema chiaro' : 'Attiva tema scuro'}
            >
              <Icon name={mode === 'dark' ? 'sun' : 'moon'} />
            </IconButton>
          </Tooltip>
          {!user && !authPage && (
            <>
              <Button component={Link} to="/login" color="inherit">
                Accedi
              </Button>
              <Button component={Link} to="/registrazione" variant="contained">
                Registrati
              </Button>
            </>
          )}
          {user && (
            <Typography variant="body2" sx={{ maxWidth: 200, overflowWrap: 'anywhere' }}>
              Ciao, {user.name}
            </Typography>
          )}
        </Stack>
      </Toolbar>
    </AppBar>
  )
}
