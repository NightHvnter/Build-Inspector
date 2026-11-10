import type { AuthMode, AuthValues, FieldErrors } from '../types/auth'

// Solo controlli del modulo: autenticazione e regole sulle password sono del backend.
export function validateAuthForm(mode: AuthMode, values: AuthValues): FieldErrors {
  const errors: FieldErrors = {}
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
    errors.email = 'Inserisci un indirizzo email valido.'
  if (mode === 'register' && !values.name.trim()) errors.name = 'Inserisci il nome utente.'
  if (!values.password) errors.password = 'Inserisci la password.'
  if (mode === 'register' && values.confirmPassword !== values.password)
    errors.confirmPassword = 'Le password non coincidono.'
  return errors
}
