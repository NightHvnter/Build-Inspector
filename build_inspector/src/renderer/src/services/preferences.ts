import type { Result } from './result'

// Preferenze dell'interfaccia, mai password, utenti o sessioni.
export function readPreference<T>(
  key: string,
  fallback: T,
  isValid: (value: unknown) => value is T
): T {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? 'null')
    return isValid(value) ? value : fallback
  } catch {
    return fallback
  }
}
export function removePreference(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // Nothing to do: the stale copy is harmless.
  }
}
export function savePreference<T>(key: string, value: T): Result<T> {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return { ok: true, data: value }
  } catch {
    return {
      ok: false,
      message: 'Impossibile salvare sul dispositivo. Verifica lo spazio disponibile.'
    }
  }
}
