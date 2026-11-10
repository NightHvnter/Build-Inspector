import { Alert, Box, Button, Checkbox, FormControlLabel, Stack, TextField } from '@mui/material'
import type { JSX } from 'react'
import type { AuthMode } from '../../types/auth'
import { useAuthForm } from '../../hooks/useAuthForm'
import { PasswordField } from './PasswordField'

export function AuthForm({ mode }: { mode: AuthMode }): JSX.Element {
  const { values, errors, feedback, busy, change, submit } = useAuthForm(mode)
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
            helperText={errors.name}
            required
            disabled={busy}
          />
        )}
        <TextField
          name="email"
          label="Indirizzo email"
          type="email"
          autoComplete={mode === 'recovery' ? 'email' : 'username'}
          value={values.email}
          onChange={(event) => change('email', event.target.value)}
          error={!!errors.email}
          helperText={errors.email}
          required
          disabled={busy}
          slotProps={{ htmlInput: { spellCheck: false, autoCapitalize: 'none' } }}
        />
        {mode !== 'recovery' && (
          <PasswordField
            name="password"
            label="Password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={values.password}
            error={errors.password}
            onChange={(value) => change('password', value)}
            disabled={busy}
          />
        )}
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
        {mode === 'login' && (
          <FormControlLabel
            control={
              <Checkbox
                checked={values.remember}
                disabled={busy}
                onChange={(event) => change('remember', event.target.checked)}
              />
            }
            label="Mantieni l’accesso"
          />
        )}
        {feedback && <Alert severity={feedback.severity}>{feedback.message}</Alert>}
        <Button type="submit" variant="contained" disabled={busy} fullWidth>
          {mode === 'register'
            ? 'Registrati'
            : mode === 'recovery'
              ? 'Richiedi recupero password'
              : 'Accedi'}
        </Button>
      </Stack>
    </Box>
  )
}
