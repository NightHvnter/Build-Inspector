// Account client for the Build Inspector API (/auth/user, /auth/login, /auth/refresh, /auth/logout).
// It runs in the main process (imported by main/accountIpc.ts): the API has no CORS, and the
// tokens must stay out of the renderer.
import {
  LOGIN_PROVIDERS,
  type AccountApi,
  type LoginProvider,
  type Result,
  type User
} from '../../shared/auth'
import { getApiBase } from '../apiUrl'
import { browserLogin, cancelBrowserLogin, type BrowserLoginResult } from './browserLogin'

export type Reply = { ok: true; data: unknown } | { ok: false; status: number; message: string }

// The account API plus requests made as the signed-in user (used by main/accountIpc.ts).
export interface AccountClient extends AccountApi {
  authorized(method: 'GET' | 'POST' | 'DELETE', path: string, body?: object): Promise<Reply>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

const invalidReply = { ok: false, message: 'Risposta del servizio account non valida.' } as const

type BrowserLoginError = Exclude<BrowserLoginResult, { ok: true }>['reason']

function browserLoginError(reason: BrowserLoginError, provider: LoginProvider): string {
  const name = LOGIN_PROVIDERS[provider]
  const messages: Record<BrowserLoginError, string> = {
    denied: `Accesso con ${name} annullato.`,
    cancelled: `Accesso con ${name} annullato.`,
    email_taken: 'Esiste già un account con questa email: accedi con email e password.',
    timeout: `Accesso con ${name} scaduto. Riprova.`,
    browser: 'Impossibile aprire il browser. Riprova.',
    failed: `Accesso con ${name} non riuscito. Riprova.`
  }
  return messages[reason]
}

interface AccountClientOptions {
  // How to show the provider's sign-in page: the main process passes shell.openExternal.
  openBrowser?: (url: string) => Promise<void>
}

export function createAccountClient(
  address: string = getApiBase(),
  { openBrowser }: AccountClientOptions = {}
): AccountClient {
  // L'indirizzo è fissato all'avvio (variabile d'ambiente o impostazioni salvate), mai da un
  // link nella pagina: cambiarlo dalle impostazioni riavvia l'app.
  const base = URL.canParse(address) ? new URL(address) : null
  const secure =
    base &&
    (base.protocol === 'https:' ||
      (base.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(base.hostname)))
  let tokens: { access: string; refresh: string } | null = null

  async function request(
    method: 'GET' | 'POST' | 'DELETE',
    path: string,
    body?: object,
    bearer?: string
  ): Promise<Reply> {
    if (!base || !secure || base.username || base.password || base.search || base.hash)
      return { ok: false, status: 0, message: 'Indirizzo del servizio account non valido.' }
    try {
      const response = await fetch(base.href.replace(/\/$/, '') + path, {
        method,
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
              : path === '/auth/oauth/exchange'
                ? 'Accesso non riuscito. Riprova.'
                : 'La sessione è scaduta. Accedi di nuovo.',
          404: 'Elemento non trovato.',
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

  const post = (path: string, body?: object, bearer?: string): Promise<Reply> =>
    request('POST', path, body, bearer)

  function acceptSession(data: unknown): Result<User> {
    if (
      !isRecord(data) ||
      typeof data.id !== 'number' ||
      !Number.isSafeInteger(data.id) ||
      typeof data.Username !== 'string' ||
      !data.Username ||
      // Steam accounts have no email.
      (data.Email !== null && (typeof data.Email !== 'string' || !data.Email)) ||
      typeof data.accessToken !== 'string' ||
      !data.accessToken ||
      typeof data.refreshToken !== 'string' ||
      !data.refreshToken
    )
      return invalidReply
    tokens = { access: data.accessToken, refresh: data.refreshToken }
    return {
      ok: true,
      data: { id: String(data.id), name: data.Username, email: data.Email as string | null }
    }
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

  // A request as the signed-in user. An expired access token is renewed once and the
  // request repeated; the tokens themselves never leave this process.
  async function authorized(
    method: 'GET' | 'POST' | 'DELETE',
    path: string,
    body?: object
  ): Promise<Reply> {
    const signedOut = {
      ok: false,
      status: 401,
      message: 'Accedi per usare la cronologia.'
    } as const
    if (!tokens) return signedOut
    const reply = await request(method, path, body, tokens.access)
    if (reply.ok || reply.status !== 401) return reply
    const renewed = await getSession()
    if (!renewed.ok) return { ok: false, status: 0, message: renewed.message }
    if (!tokens || !renewed.data) return signedOut
    return request(method, path, body, tokens.access)
  }

  return {
    authorized,
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
    async signInWithProvider(provider) {
      if (!base || !secure || !openBrowser || !Object.hasOwn(LOGIN_PROVIDERS, provider))
        return { ok: false, message: 'Accesso non disponibile.' }
      const root = base.href.replace(/\/$/, '')
      const login = await browserLogin({
        startUrl: ({ port, challenge, state }) =>
          root +
          `/auth/${provider}/start?` +
          new URLSearchParams({ port: String(port), challenge, state }),
        openBrowser
      })
      if (!login.ok) return { ok: false, message: browserLoginError(login.reason, provider) }
      const reply = await post('/auth/oauth/exchange', {
        code: login.code,
        verifier: login.verifier
      })
      return reply.ok ? acceptSession(reply.data) : reply
    },
    async cancelBrowserSignIn() {
      cancelBrowserLogin()
      return { ok: true, data: null }
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
