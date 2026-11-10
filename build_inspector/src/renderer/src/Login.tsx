import { Alert, Box, Button, Paper, Stack, Tab, Tabs, Typography } from '@mui/material'
import { Link, Navigate, useLocation } from 'react-router-dom'
import type { JSX } from 'react'
import { AuthForm } from './components/auth/AuthForm'
import { useAuth } from './hooks/useAuth'
import type { AuthMode } from './types/auth'
import { authLink, getAuthDestination } from './utils/authNavigation'

const titles = { login: 'Accedi', register: 'Registrazione', recovery: 'Recupera password' }
const descriptions = {
  login: 'Inserisci le credenziali del tuo account.',
  register: 'Inserisci i dati per richiedere la creazione di un account.',
  recovery: 'Inserisci l’email associata al tuo account per richiedere il recupero della password.'
}

export function AuthPage({ mode }: { mode: AuthMode }): JSX.Element {
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
        {!configured && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Accesso, registrazione e recupero password non sono ancora attivi. Il servizio account
            deve essere collegato.
          </Alert>
        )}
        <AuthForm key={mode} mode={mode} />
        <Stack sx={{ alignItems: 'center', mt: 2 }}>
          {mode === 'login' ? (
            <Button component={Link} to={authLink('/recupera-password', destination)}>
              Password dimenticata?
            </Button>
          ) : (
            <Button component={Link} to={authLink('/login', destination)}>
              Torna ad accedere
            </Button>
          )}
        </Stack>
      </Paper>
    </Box>
  )
}
