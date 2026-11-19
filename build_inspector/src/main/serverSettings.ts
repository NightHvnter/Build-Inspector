import { app, ipcMain, type IpcMainInvokeEvent } from 'electron'
import { readFileSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  DEFAULT_SERVER_URL,
  normalizeServerUrl,
  serverChannels,
  type ServerSettings
} from '../shared/server'
import { setApiBase } from '../preload/apiUrl'

const file = (): string => join(app.getPath('userData'), 'server.json')

function savedUrl(): string | null {
  try {
    return normalizeServerUrl((JSON.parse(readFileSync(file(), 'utf8')) as { url?: unknown }).url)
  } catch {
    return null
  }
}

// The address in use: BUILD_INSPECTOR_API_URL, then the saved one, then the default.
export function currentServer(): ServerSettings {
  const env = normalizeServerUrl(process.env.BUILD_INSPECTOR_API_URL)
  const saved = savedUrl()
  return {
    url: env ?? saved ?? DEFAULT_SERVER_URL,
    source: env ? 'env' : saved ? 'saved' : 'default',
    defaultUrl: DEFAULT_SERVER_URL
  }
}

// Must run before anything talks to the API (registerIpc, registerAccountIpc).
export function loadServerUrl(): string {
  const { url } = currentServer()
  setApiBase(url)
  return url
}

// An address answers like the Build Inspector API when its genres route returns a list.
async function testServer(
  url: string
): Promise<{ ok: true; data: null } | { ok: false; message: string }> {
  try {
    const response = await fetch(url + '/steam/games/top/genres', {
      redirect: 'error',
      signal: AbortSignal.timeout(10000)
    })
    if (!response.ok)
      return { ok: false, message: `Il server ha risposto con errore ${response.status}.` }
    const body: unknown = await response.json()
    return Array.isArray(body)
      ? { ok: true, data: null }
      : { ok: false, message: 'Questo indirizzo non è un server Build Inspector.' }
  } catch {
    return {
      ok: false,
      message: 'Server non raggiungibile. Controlla l’indirizzo e che l’API sia avviata.'
    }
  }
}

export function registerServerIpc(trusted: (event: IpcMainInvokeEvent) => boolean): void {
  const invalid = {
    ok: false,
    message: 'Indirizzo non valido: usa https://… (http solo per localhost).'
  }
  ipcMain.handle(serverChannels.get, (event) => (trusted(event) ? currentServer() : null))
  ipcMain.handle(serverChannels.test, (event, url: unknown) => {
    const normalized = trusted(event) ? normalizeServerUrl(url) : null
    return normalized ? testServer(normalized) : invalid
  })
  ipcMain.handle(serverChannels.save, async (event, url: unknown) => {
    if (!trusted(event)) return invalid
    const normalized = url === null ? null : normalizeServerUrl(url)
    if (url !== null && !normalized) return invalid
    try {
      await writeFile(file(), JSON.stringify({ url: normalized }), 'utf8')
    } catch {
      return { ok: false, message: 'Impossibile salvare l’impostazione.' }
    }
    // The account client and every call read the address at start-up: restart to use it.
    setTimeout(() => {
      app.relaunch()
      app.exit(0)
    }, 300)
    return { ok: true, data: null }
  })
}
