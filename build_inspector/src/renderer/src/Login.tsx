import { Alert, Box, Button, Paper, Stack, Tab, Tabs, Typography } from '@mui/material'
import { Link, Navigate, useLocation } from 'react-router-dom'
import type { JSX } from 'react'
import { AuthForm } from './components/auth/AuthForm'
import { useAuth } from './hooks/useAuth'
import type { AuthMode } from './types/auth'
import { authLink, getAuthDestination } from './utils/authNavigation'

const titles = { login: 'Accedi', register: 'Registrazione', recovery: 'Recupera password' }
const descriptions = {
  login: 'Inserisci email e password. La sessione termina quando chiudi l’app.',
  register: 'Crea il tuo account con un nome utente, un’email e una password.',
  recovery: 'Al momento non è disponibile il recupero della password via email.'
}

export function AuthPage({ mode }: { mode: AuthMode | 'recovery' }): JSX.Element {
  const { user, configured } = useAuth()
  const { search } = useLocation()
  const destination = getAuthDestination(search)
  if (user) return <Navigate to={destination} replace />

  return (
    <Box>
      <Button component={Link} to="/libreria" color="inherit" sx={{ mb: 2 }}>
        Torna alla libreria
      </Button>
      <Paper variant="outlined" sx={{ maxWidth: 470, mx: 'auto', p: { xs: 2.5, sm: 3.5 } }}>
        {mode !== 'recovery' && (
          <Tabs
            value={mode}
            variant="fullWidth"
            sx={{ mb: 3 }}
            aria-label="Accesso e registrazione"
          >
            <Tab
              component={Link}
              to={authLink('/login', destination)}
              value="login"
              label="Accedi"
            />
            <Tab
              component={Link}
              to={authLink('/registrazione', destination)}
              value="register"
              label="Registrati"
            />
          </Tabs>
        )}
        <Typography component="h1" variant="h5" gutterBottom>
          {titles[mode]}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {descriptions[mode]}
        </Typography>
        {!configured && mode !== 'recovery' && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Accesso e registrazione sono disponibili nell’app desktop.
          </Alert>
        )}
        {mode !== 'recovery' && <AuthForm key={mode} mode={mode} />}
        <Stack sx={{ alignItems: 'center', mt: 2 }}>
          {mode === 'login' ? (
            <Button component={Link} to={authLink('/recupera-password', destination)}>
              Password dimenticata?
            </Button>
          ) : (
            <Button component={Link} to={authLink('/login', destination)}>
              Torna al login
            </Button>
          )}
        </Stack>
      </Paper>
    </Box>
  )
}
