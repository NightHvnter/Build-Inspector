import type { AccountApi } from '../../../shared/auth'
import type { Result } from './result'

export interface AuthService extends AccountApi {
  configured: boolean
}

const unavailable = async (): Promise<Result<never>> => ({
  ok: false,
  message: 'Per usare il servizio account, apri l’app desktop.'
})

const account = window.api?.account
export const authService: AuthService = account
  ? { configured: true, ...account }
  : {
      configured: false,
      getSession: async () => ({ ok: true, data: null }),
      signIn: unavailable,
      signUp: unavailable,
      signOut: unavailable
    }
