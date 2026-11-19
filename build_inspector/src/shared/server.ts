import type { Result } from './auth'

export const DEFAULT_SERVER_URL = 'http://localhost:3636'

// Where the address in use comes from: the BUILD_INSPECTOR_API_URL variable wins over the
// one saved in the settings, which wins over the default.
export type ServerUrlSource = 'env' | 'saved' | 'default'

export interface ServerSettings {
  url: string
  source: ServerUrlSource
  defaultUrl: string
}

// What the preload exposes to the renderer as window.api.server.
export interface ServerApi {
  get(): Promise<ServerSettings>
  // Checks that an address answers like the Build Inspector API, without saving it.
  test(url: string): Promise<Result<null>>
  // Saves the address (null: back to the default) and restarts the app to use it.
  save(url: string | null): Promise<Result<null>>
}

export const serverChannels = {
  get: 'server:get',
  test: 'server:test',
  save: 'server:save'
} as const

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '[::1]']

// "https://x.trycloudflare.com/" → "https://x.trycloudflare.com", or null when the address
// can't be used: https only, except plain http on this computer (tokens travel on it).
export function normalizeServerUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 300) return null
  const text = value.trim()
  if (!URL.canParse(text)) return null
  const url = new URL(text)
  const secure =
    url.protocol === 'https:' || (url.protocol === 'http:' && LOCAL_HOSTS.includes(url.hostname))
  if (!secure || url.username || url.password || url.search || url.hash) return null
  return (url.origin + url.pathname).replace(/\/+$/, '')
}
