// @vitest-environment node
import { createServer, type Server } from 'node:http'
import { afterEach, expect, it } from 'vitest'
import { createAccountClient, type AccountClient } from '../src/preload/auth/auth'

type Received = { path?: string; method?: string; auth?: string; body?: unknown }
let server: Server | undefined

// Server HTTP di test: usa i DTO e i codici dei controller NestJS di dev/api.
async function fixture(
  responses: [number, unknown?][]
): Promise<{ client: AccountClient; requests: Received[] }> {
  const requests: Received[] = []
  server = createServer(async (req, res) => {
    let text = ''
    for await (const chunk of req) text += chunk
    requests.push({
      path: req.url,
      method: req.method,
      auth: req.headers.authorization,
      body: text ? JSON.parse(text) : undefined
    })
    const [status, data] = responses.shift() ?? [500]
    res.writeHead(status, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(data))
  })
  const http = server
  await new Promise<void>((ready) => http.listen(0, '127.0.0.1', ready))
  const address = http.address()
  const port = address && typeof address !== 'string' ? address.port : 0
  return { client: createAccountClient('http://127.0.0.1:' + port), requests }
}

afterEach(async () => {
  const http = server
  if (http) await new Promise<void>((resolve) => http.close(() => resolve()))
  server = undefined
})

const profile = { id: 7, Username: 'Studente', Email: 'test@example.com' }
const tokens = { ...profile, accessToken: 'access-1', refreshToken: 'refresh-1' }
const credentials = { email: profile.Email, password: 'Demo12345' }
const user = { id: '7', name: profile.Username, email: profile.Email }

it('invia i DTO del gruppo e restituisce al renderer solo il profilo, anche dopo il rinnovo', async () => {
  const { client, requests } = await fixture([
    [201, { Id: 7, Username: profile.Username, Email: profile.Email }],
    [200, tokens],
    [200, { ...tokens, accessToken: 'access-2', refreshToken: 'refresh-2' }],
    [204]
  ])
  expect((await client.signUp({ ...credentials, name: profile.Username })).ok).toBe(true)
  expect(await client.getSession()).toEqual({ ok: true, data: null })
  expect(await client.signIn(credentials)).toEqual({ ok: true, data: user })
  const renewals = await Promise.all([client.getSession(), client.getSession()])
  expect(renewals).toEqual([
    { ok: true, data: user },
    { ok: true, data: user }
  ])
  expect(await client.signOut()).toEqual({ ok: true, data: null })
  expect(await client.getSession()).toEqual({ ok: true, data: null })
  expect(requests).toEqual([
    {
      method: 'POST',
      path: '/auth/user',
      body: { Username: profile.Username, Email: profile.Email, Password: credentials.password }
    },
    {
      method: 'POST',
      path: '/auth/login',
      body: { Email: profile.Email, Password: credentials.password }
    },
    { method: 'POST', path: '/auth/refresh', body: { refreshToken: 'refresh-1' } },
    { method: 'POST', path: '/auth/logout', auth: 'Bearer access-2' }
  ])
})

it('gestisce credenziali non valide, duplicati e risposte incomplete senza autenticare', async () => {
  const { client } = await fixture([[401], [409], [200, profile], [201, {}]])
  expect(await client.signIn(credentials)).toMatchObject({
    ok: false,
    message: 'Email o password errate.'
  })
  expect(await client.signUp({ ...credentials, name: profile.Username })).toMatchObject({
    ok: false,
    status: 409
  })
  expect((await client.signIn(credentials)).ok).toBe(false)
  expect((await client.signUp({ ...credentials, name: profile.Username })).ok).toBe(false)
  expect(await client.getSession()).toEqual({ ok: true, data: null })
})

it('rinnova una sola volta al logout e usa il nuovo bearer', async () => {
  const { client, requests } = await fixture([
    [200, tokens],
    [401],
    [200, { ...tokens, accessToken: 'new' }],
    [204]
  ])
  await client.signIn(credentials)
  expect((await client.signOut()).ok).toBe(true)
  expect(requests.slice(1).map(({ path, auth }) => [path, auth])).toEqual([
    ['/auth/logout', 'Bearer access-1'],
    ['/auth/refresh', undefined],
    ['/auth/logout', 'Bearer new']
  ])
})

it('torna ospite se anche il server rifiuta il refresh token', async () => {
  const { client, requests } = await fixture([[200, tokens], [401]])
  await client.signIn(credentials)
  expect(await client.getSession()).toEqual({ ok: true, data: null })
  expect(await client.getSession()).toEqual({ ok: true, data: null })
  expect(requests).toHaveLength(2)
})

it('fa le richieste della cronologia con il token e lo rinnova una volta se è scaduto', async () => {
  const { client, requests } = await fixture([
    [200, tokens],
    [401, { message: 'Unauthorized' }],
    [200, { ...tokens, accessToken: 'access-2', refreshToken: 'refresh-2' }],
    [200, [{ id: 1 }]],
    [204]
  ])
  expect(await client.authorized('GET', '/history')).toEqual({
    ok: false,
    status: 401,
    message: 'Accedi per usare la cronologia.'
  })
  await client.signIn(credentials)
  expect(await client.authorized('GET', '/history')).toEqual({ ok: true, data: [{ id: 1 }] })
  expect(await client.authorized('DELETE', '/history/1')).toEqual({ ok: true, data: null })
  expect(requests.map((r) => [r.method, r.path, r.auth])).toEqual([
    ['POST', '/auth/login', undefined],
    ['GET', '/history', 'Bearer access-1'],
    ['POST', '/auth/refresh', undefined],
    ['GET', '/history', 'Bearer access-2'],
    ['DELETE', '/history/1', 'Bearer access-2']
  ])
})
