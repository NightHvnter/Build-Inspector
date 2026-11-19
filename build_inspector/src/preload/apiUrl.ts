import { DEFAULT_SERVER_URL, normalizeServerUrl } from '../shared/server'

// Base address of the Build Inspector API (api/). The main process sets it once at start-up
// from BUILD_INSPECTOR_API_URL or the saved settings (see main/serverSettings.ts).
let base = normalizeServerUrl(process.env.BUILD_INSPECTOR_API_URL) ?? DEFAULT_SERVER_URL

export function setApiBase(url: string): void {
  base = url
}

export function getApiBase(): string {
  return base
}

export function apiUrl(path: string): string {
  return base + (path.startsWith('/') ? path : '/' + path)
}
