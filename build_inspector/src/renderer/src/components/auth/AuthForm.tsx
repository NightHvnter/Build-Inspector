import { Alert, Box, Button, Divider, Stack, TextField, Typography } from '@mui/material'
import type { JSX } from 'react'
import type { AuthMode } from '../../types/auth'
import { LOGIN_PROVIDERS, type LoginProvider } from '../../../../shared/auth'
import { useAuthForm } from '../../hooks/useAuthForm'
import { PasswordField } from './PasswordField'

// Google's "G", as its sign-in branding guidelines ask for.
function GoogleLogo(): JSX.Element {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.6 13.3l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.8c4.3-4 6.9-9.9 6.9-17.2z"
      />
      <path
        fill="#FBBC05"
        d="M10.5 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.6 10.7l7.9-6.1z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.8c-2.1 1.4-4.8 2.3-8.5 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.6 42.6 14.6 48 24 48z"
      />
    </svg>
  )
}

// Discord's mark (its "Clyde" logo), in Discord's brand colour.
function DiscordLogo(): JSX.Element {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#5865F2"
        d="M20.32 4.37A19.8 19.8 0 0 0 15.4 2.84a.07.07 0 0 0-.08.04c-.21.38-.45.87-.61 1.25a18.3 18.3 0 0 0-5.49 0 12.6 12.6 0 0 0-.62-1.25.08.08 0 0 0-.08-.04 19.7 19.7 0 0 0-4.92 1.53.07.07 0 0 0-.03.03C.53 9.05-.32 13.58.1 18.06a.08.08 0 0 0 .03.06 19.9 19.9 0 0 0 6 3.03.08.08 0 0 0 .08-.03c.46-.63.87-1.3 1.23-1.99a.08.08 0 0 0-.04-.1 13.1 13.1 0 0 1-1.87-.9.08.08 0 0 1-.01-.13l.37-.29a.07.07 0 0 1 .08-.01c3.93 1.79 8.18 1.79 12.07 0a.07.07 0 0 1 .08.01l.37.29a.08.08 0 0 1-.01.13c-.6.35-1.22.65-1.87.9a.08.08 0 0 0-.04.1c.36.7.77 1.36 1.22 1.99a.08.08 0 0 0 .09.03 19.8 19.8 0 0 0 6-3.03.08.08 0 0 0 .03-.05c.5-5.18-.84-9.68-3.55-13.66a.06.06 0 0 0-.03-.03zM8.02 15.33c-1.18 0-2.16-1.09-2.16-2.42s.96-2.42 2.16-2.42c1.21 0 2.18 1.1 2.16 2.42 0 1.33-.96 2.42-2.16 2.42zm7.97 0c-1.18 0-2.16-1.09-2.16-2.42s.96-2.42 2.16-2.42c1.21 0 2.18 1.1 2.16 2.42 0 1.33-.95 2.42-2.16 2.42z"
      />
    </svg>
  )
}

const LOGOS: Record<LoginProvider, () => JSX.Element> = { google: GoogleLogo, discord: DiscordLogo }

export function AuthForm({ mode }: { mode: AuthMode }): JSX.Element {
  const {
    values,
    errors,
    feedback,
    busy,
    change,
    submit,
    inBrowser,
    signInWithProvider,
    cancelBrowser
  } = useAuthForm(mode)
  return (
    <Box component="form" noValidate onSubmit={submit} aria-busy={busy}>
      <Stack spacing={2.5}>
        {mode === 'register' && (
          <TextField
            name="name"
            label="Nome utente"
            autoComplete="nickname"
            value={values.name}
            onChange={(event) => change('name', event.target.value)}
            error={!!errors.name}
            helperText={
              errors.name ??
              'Da 3 a 50 caratteri: lettere, numeri, punto, trattino o trattino basso.'
            }
            required
            disabled={busy}
          />
        )}
        <TextField
          name="email"
          label="Indirizzo email"
          type="email"
          autoComplete={mode === 'register' ? 'email' : 'username'}
          value={values.email}
          onChange={(event) => change('email', event.target.value)}
          error={!!errors.email}
          helperText={errors.email}
          required
          disabled={busy}
          slotProps={{ htmlInput: { spellCheck: false, autoCapitalize: 'none' } }}
        />
        <PasswordField
          name="password"
          label="Password"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          value={values.password}
          error={errors.password}
          hint={
            mode === 'register'
              ? 'Da 8 a 72 caratteri, con una maiuscola, una minuscola e un numero.'
              : undefined
          }
          onChange={(value) => change('password', value)}
          disabled={busy}
        />
        {mode === 'register' && (
          <PasswordField
            name="confirmPassword"
            label="Conferma password"
            autoComplete="new-password"
            value={values.confirmPassword}
            error={errors.confirmPassword}
            onChange={(value) => change('confirmPassword', value)}
            disabled={busy}
          />
        )}
        {feedback && <Alert severity={feedback.severity}>{feedback.message}</Alert>}
        <Button type="submit" variant="contained" disabled={busy} fullWidth>
          {mode === 'register' ? 'Registrati' : 'Accedi'}
        </Button>
        <Divider>
          <Typography variant="caption" color="text.secondary">
            oppure
          </Typography>
        </Divider>
        {inBrowser ? (
          <Stack spacing={1} role="status">
            <Alert severity="info">
              Completa l’accesso con {LOGIN_PROVIDERS[inBrowser]} nel browser che si è aperto.
            </Alert>
            <Button onClick={cancelBrowser} fullWidth>
              Annulla
            </Button>
          </Stack>
        ) : (
          (Object.keys(LOGIN_PROVIDERS) as LoginProvider[]).map((provider) => {
            const Logo = LOGOS[provider]
            return (
              <Button
                key={provider}
                variant="outlined"
                color="inherit"
                onClick={() => void signInWithProvider(provider)}
                disabled={busy}
                fullWidth
                startIcon={<Logo />}
              >
                Continua con {LOGIN_PROVIDERS[provider]}
              </Button>
            )
          })
        )}
      </Stack>
    </Box>
  )
}
