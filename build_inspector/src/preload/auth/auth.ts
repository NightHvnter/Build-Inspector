// Account client for the Build Inspector API (/auth/user, /auth/login, /auth/refresh, /auth/logout).
// It runs in the main process (imported by main/accountIpc.ts): the API has no CORS, and the
// tokens must stay out of the renderer.
import type { AccountApi, Result, User } from '../../shared/auth'
import { API_URL } from '../apiUrl'

type Reply = { ok: true; data: unknown } | { ok: false; status: number; message: string }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

const invalidReply = { ok: false, message: 'Risposta del servizio account non valida.' } as const

export function createAccountClient(address: string = API_URL): AccountApi {
  // L'indirizzo è configurato all'avvio, mai da un campo o da un link nella pagina.
  const base = URL.canParse(address) ? new URL(address) : null
  const secure =
    base &&
    (base.protocol === 'https:' ||
      (base.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(base.hostname)))
  let tokens: { access: string; refresh: string } | null = null

  async function post(path: string, body?: object, bearer?: string): Promise<Reply> {
    if (!base || !secure || base.username || base.password || base.search || base.hash)
      return { ok: false, status: 0, message: 'Indirizzo del servizio account non valido.' }
    try {
      const response = await fetch(base.href.replace(/\/$/, '') + path, {
        method: 'POST',
        redirect: 'error',
        signal: AbortSignal.timeout(10000),
        headers: {
          ...(body && { 'Content-Type': 'application/json' }),
          ...(bearer && { Authorization: 'Bearer ' + bearer })
        },
        body: body ? JSON.stringify(body) : undefined
      })
      if (!response.ok) {
        const messages: Record<number, string> = {
          400: 'Controlla i dati inseriti e riprova.',
          401:
            path === '/auth/login'
              ? 'Email o password errate.'
              : 'La sessione è scaduta. Accedi di nuovo.',
          409: 'Nome utente o email già in uso.'
        }
        return {
          ok: false,
          status: response.status,
          message:
            messages[response.status] ??
            'Il servizio account non ha completato la richiesta. Riprova.'
        }
      }
      if (response.status === 204) return { ok: true, data: null }
      try {
        return { ok: true, data: await response.json() }
      } catch {
        return { ...invalidReply, status: response.status }
      }
    } catch {
      return {
        ok: false,
        status: 0,
        message: 'Servizio account non raggiungibile. Controlla la connessione e riprova.'
      }
    }
  }

  function acceptSession(data: unknown): Result<User> {
    if (
      !isRecord(data) ||
      typeof data.id !== 'number' ||
      !Number.isSafeInteger(data.id) ||
      typeof data.Username !== 'string' ||
      !data.Username ||
      typeof data.Email !== 'string' ||
      !data.Email ||
      typeof data.accessToken !== 'string' ||
      !data.accessToken ||
      typeof data.refreshToken !== 'string' ||
      !data.refreshToken
    )
      return invalidReply
    tokens = { access: data.accessToken, refresh: data.refreshToken }
    return { ok: true, data: { id: String(data.id), name: data.Username, email: data.Email } }
  }

  async function refreshSession(): Promise<Result<User | null>> {
    if (!tokens) return { ok: true, data: null }
    const reply = await post('/auth/refresh', { refreshToken: tokens.refresh })
    if (!reply.ok && reply.status === 401) {
      tokens = null
      return { ok: true, data: null }
    }
    return reply.ok ? acceptSession(reply.data) : reply
  }

  // Due richieste contemporanee devono usare una sola rotazione del refresh token.
  let refreshing: Promise<Result<User | null>> | undefined
  function getSession(): Promise<Result<User | null>> {
    refreshing ??= refreshSession().finally(() => {
      refreshing = undefined
    })
    return refreshing
  }

  return {
    getSession,
    async signIn({ email, password }) {
      const reply = await post('/auth/login', { Email: email, Password: password })
      return reply.ok ? acceptSession(reply.data) : reply
    },
    async signUp({ name, email, password }) {
      const reply = await post('/auth/user', { Username: name, Email: email, Password: password })
      if (!reply.ok) return reply
      if (
        !isRecord(reply.data) ||
        typeof reply.data.Id !== 'number' ||
        typeof reply.data.Username !== 'string' ||
        typeof reply.data.Email !== 'string'
      )
        return invalidReply
      return { ok: true, data: { message: 'Account creato. Ora puoi accedere.' } }
    },
    async signOut() {
      if (!tokens) return { ok: true, data: null }
      let reply = await post('/auth/logout', undefined, tokens.access)
      if (!reply.ok && reply.status === 401) {
        const renewed = await getSession()
        if (!renewed.ok) return renewed
        if (!tokens || !renewed.data) return { ok: true, data: null }
        reply = await post('/auth/logout', undefined, tokens.access)
      }
      if (!reply.ok) return reply
      tokens = null
      return { ok: true, data: null }
    }
  }
}
