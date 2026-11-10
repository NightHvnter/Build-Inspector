// Base address of the Build Inspector API (api/). Override it with BUILD_INSPECTOR_API_URL.
export const API_URL = (process.env.BUILD_INSPECTOR_API_URL ?? 'http://localhost:3636').replace(
  /\/+$/,
  ''
)

export function apiUrl(path: string): string {
  return API_URL + (path.startsWith('/') ? path : '/' + path)
}
