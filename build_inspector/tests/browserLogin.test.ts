// @vitest-environment node
import { createServer, type Server } from 'node:http'
import { createHash } from 'node:crypto'
import { afterEach, expect, it } from 'vitest'
import { createAccountClient } from '../src/preload/auth/auth'
import { browserLogin } from '../src/preload/auth/browserLogin'

let api: Server | undefined
afterEach(async () => {
  const server = api
  if (server) await new Promise<void>((done) => server.close(() => done()))
  api = undefined
})

const tokens = {
  id: 7,
  Username: 'Mario.Rossi',
  Email: 'mario@example.com',
  accessToken: 'a',
  refreshToken: 'r'
}
const CODE = 'c'.repeat(43)

// A stand-in for the API: only /auth/oauth/exchange is called by the app itself.
async function fakeApi(): Promise<{
  base: string
  exchanges: { code: string; verifier: string }[]
}> {
  const exchanges: { code: string; verifier: string }[] = []
  api = createServer(async (req, res) => {
    let text = ''
    for await (const chunk of req) text += chunk
    if (req.url === '/auth/oauth/exchange') exchanges.push(JSON.parse(text))
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(tokens))
  })
  const server = api
  await new Promise<void>((ready) => server.listen(0, '127.0.0.1', ready))
  const address = server.address()
  return {
    base: 'http://127.0.0.1:' + (address && typeof address !== 'string' ? address.port : 0),
    exchanges
  }
}

// Plays the browser: reads where the app asked to go, then lands on the app's callback
// the way the API's redirect would, with the given query.
function browser(reply: (start: URL) => Record<string, string>, seen: URL[] = []) {
  return async (url: string): Promise<void> => {
    const start = new URL(url)
    seen.push(start)
    const back = new URL(`http://127.0.0.1:${start.searchParams.get('port')}/callback`)
    for (const [key, value] of Object.entries(reply(start))) back.searchParams.set(key, value)
    const page = await fetch(back)
    await page.text()
  }
}

it('signs in through the browser and proves it started the login', async () => {
  const { base, exchanges } = await fakeApi()
  const seen: URL[] = []
  const client = createAccountClient(base, {
    openBrowser: browser((start) => ({ code: CODE, state: start.searchParams.get('state')! }), seen)
  })
  expect(await client.signInWithProvider('google')).toEqual({
    ok: true,
    data: { id: '7', name: 'Mario.Rossi', email: 'mario@example.com' }
  })
  expect(seen[0].origin + seen[0].pathname).toBe(base + '/auth/google/start')
  // The verifier sent with the code must hash to the challenge sent at the start.
  const [{ code, verifier }] = exchanges
  expect(code).toBe(CODE)
  expect(createHash('sha256').update(verifier).digest('base64url')).toBe(
    seen[0].searchParams.get('challenge')
  )
  // Signed in for real: authorized requests now carry the token.
  expect((await client.authorized('GET', '/history')).ok).toBe(true)
})

it('turns the API’s errors into messages', async () => {
  const { base, exchanges } = await fakeApi()
  for (const [error, message] of [
    ['denied', 'Accesso con Google annullato.'],
    ['email_taken', 'Esiste già un account con questa email: accedi con email e password.'],
    ['something', 'Accesso con Google non riuscito. Riprova.']
  ]) {
    const client = createAccountClient(base, {
      openBrowser: browser((start) => ({ error, state: start.searchParams.get('state')! }))
    })
    expect(await client.signInWithProvider('google')).toEqual({ ok: false, message })
  }
  expect(exchanges).toEqual([])
})

it('ignores a callback for another login, and gives up after the timeout', async () => {
  const result = await browserLogin({
    startUrl: ({ port, state }) => `http://example.test/start?port=${port}&state=${state}`,
    openBrowser: browser(() => ({ code: CODE, state: 'someone-elses-login' })),
    timeoutMs: 200
  })
  expect(result).toEqual({ ok: false, reason: 'timeout' })
})

it('can be cancelled, also by starting a new login', async () => {
  const first = browserLogin({
    startUrl: () => 'http://example.test/',
    openBrowser: async () => {}
  })
  const second = browserLogin({
    startUrl: () => 'http://example.test/',
    openBrowser: async () => {},
    timeoutMs: 50
  })
  expect(await first).toEqual({ ok: false, reason: 'cancelled' })
  expect(await second).toEqual({ ok: false, reason: 'timeout' })
})

it('reports a browser that could not be opened', async () => {
  const client = createAccountClient('http://127.0.0.1:9', {
    openBrowser: async () => {
      throw new Error('no browser')
    }
  })
  expect(await client.signInWithProvider('google')).toEqual({
    ok: false,
    message: 'Impossibile aprire il browser. Riprova.'
  })
})

it('uses the same flow for Discord, with its own start address and messages', async () => {
  const { base, exchanges } = await fakeApi()
  const seen: URL[] = []
  const client = createAccountClient(base, {
    openBrowser: browser((start) => ({ code: CODE, state: start.searchParams.get('state')! }), seen)
  })
  expect((await client.signInWithProvider('discord')).ok).toBe(true)
  expect(seen[0].pathname).toBe('/auth/discord/start')
  expect(exchanges).toHaveLength(1)

  const denied = createAccountClient(base, {
    openBrowser: browser((start) => ({ error: 'denied', state: start.searchParams.get('state')! }))
  })
  expect(await denied.signInWithProvider('discord')).toEqual({
    ok: false,
    message: 'Accesso con Discord annullato.'
  })
  // Only the providers the app knows can be asked for.
  expect(await client.signInWithProvider('myspace' as never)).toEqual({
    ok: false,
    message: 'Accesso non disponibile.'
  })
})
