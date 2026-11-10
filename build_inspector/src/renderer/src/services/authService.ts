import type { SignInRequest, SignUpRequest, User } from '../types/auth'
import type { Result } from './result'

// Contratto da implementare quando saranno disponibili le API del backend.
// Il server gestisce utenti, password, sessioni, scadenze e recupero account.
// Nessuna credenziale o sessione viene salvata nel localStorage del frontend.
export interface AuthService {
  configured: boolean
  getSession: () => Promise<Result<User | null>>
  signIn: (values: SignInRequest) => Promise<Result<User>>
  signUp: (values: SignUpRequest) => Promise<Result<{ message: string }>>
  signOut: () => Promise<Result<null>>
  recoverPassword: (email: string) => Promise<Result<{ message: string }>>
}

const unavailable = async (): Promise<Result<never>> => ({
  ok: false,
  message: 'Il servizio account non è ancora disponibile. Puoi continuare a consultare i giochi.'
})

// Non inventiamo endpoint o accessi riusciti. Sostituire questo adattatore con
// chiamate alle API reali; useAuth e i componenti non devono cambiare.
export const authService: AuthService = {
  configured: false,
  getSession: async () => ({ ok: true, data: null }),
  signIn: unavailable,
  signUp: unavailable,
  signOut: unavailable,
  recoverPassword: unavailable
}
