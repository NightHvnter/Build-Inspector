// Signing in through the user's own browser (Google), as desktop apps should (RFC 8252):
// a one-off server on 127.0.0.1 receives the redirect back from the API. Runs in the main process.
import { createServer, type Server } from 'node:http'
import { createHash, randomBytes } from 'node:crypto'

export type BrowserLoginResult =
  | { ok: true; code: string; verifier: string }
  | { ok: false; reason: 'denied' | 'email_taken' | 'failed' | 'timeout' | 'cancelled' | 'browser' }

interface BrowserLoginOptions {
  // The API's start address for this login, e.g. http://localhost:3636/auth/google/start?…
  startUrl: (params: { port: number; challenge: string; state: string }) => string
  openBrowser: (url: string) => Promise<void>
  timeoutMs?: number
}

const PAGE = (title: string, text: string): string =>
  `<!doctype html><meta charset="utf-8"><title>Build Inspector</title>` +
  `<body style="font-family:system-ui;margin:3rem"><h1>${title}</h1><p>${text}</p></body>`

const REASONS = new Set(['denied', 'email_taken', 'failed'])
const random = (): string => randomBytes(32).toString('base64url')

// Only one browser login at a time: starting another cancels the previous one.
let cancelCurrent: (() => void) | null = null

export function cancelBrowserLogin(): void {
  cancelCurrent?.()
}

export async function browserLogin(options: BrowserLoginOptions): Promise<BrowserLoginResult> {
  cancelBrowserLogin()
  // Installed before anything waits, so a cancel during start-up isn't lost.
  let finishLogin: ((result: BrowserLoginResult) => void) | null = null
  let cancelledEarly = false
  const cancel = (): void => {
    if (finishLogin) finishLogin({ ok: false, reason: 'cancelled' })
    else cancelledEarly = true
  }
  cancelCurrent = cancel

  const verifier = random()
  const challenge = createHash('sha256').update(verifier).digest('base64url')
  const state = random()
  const server: Server = createServer()
  const close = (): void => {
    // A newer login may already have replaced this one's cancel handler.
    if (cancelCurrent === cancel) cancelCurrent = null
    server.closeAllConnections?.()
    server.close()
  }
  await new Promise<void>((ready, fail) => {
    server.once('error', fail)
    server.listen(0, '127.0.0.1', () => ready())
  }).catch(() => null)
  const address = server.address()
  if (cancelledEarly || !address || typeof address === 'string') {
    close()
    return { ok: false, reason: cancelledEarly ? 'cancelled' : 'failed' }
  }

  let timer: ReturnType<typeof setTimeout> | undefined
  const result = await new Promise<BrowserLoginResult>((finish) => {
    finishLogin = finish
    timer = setTimeout(() => finish({ ok: false, reason: 'timeout' }), options.timeoutMs ?? 180000)
    server.on('request', (req, res) => {
      const url = new URL(req.url ?? '/', 'http://127.0.0.1')
      const send = (status: number, html: string): void => {
        res.writeHead(status, {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store'
        })
        res.end(html)
      }
      // Ignore anything that isn't the API's redirect for this very login.
      if (
        req.method !== 'GET' ||
        url.pathname !== '/callback' ||
        url.searchParams.get('state') !== state
      ) {
        send(404, PAGE('Pagina non trovata', 'Torna all’app Build Inspector.'))
        return
      }
      const code = url.searchParams.get('code')
      if (code && /^[A-Za-z0-9_-]{43,128}$/.test(code)) {
        send(200, PAGE('Accesso completato', 'Puoi chiudere questa scheda e tornare all’app.'))
        finish({ ok: true, code, verifier })
        return
      }
      const error = url.searchParams.get('error') ?? 'failed'
      send(200, PAGE('Accesso non riuscito', 'Torna all’app Build Inspector per riprovare.'))
      finish({ ok: false, reason: (REASONS.has(error) ? error : 'failed') as 'failed' })
    })
    options
      .openBrowser(options.startUrl({ port: address.port, challenge, state }))
      .catch(() => finish({ ok: false, reason: 'browser' }))
  })

  clearTimeout(timer)
  close()
  return result
}
