import { act, cleanup, render, renderHook, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { AuthProvider } from '../providers/AuthProvider'
import { LoadingProvider } from '../providers/LoadingProvider'
import { LoadingOverlay } from '../components/common/LoadingOverlay'
import { useAuth } from '../hooks/useAuth'
import { useLoading } from '../hooks/useLoading'
import { authService, type AuthService } from '../services/authService'
import type { Result } from '../services/result'
import { useThemeMode } from '../hooks/useThemeMode'

const user = { id: 'server-user', name: 'Utente di test', email: 'test@example.com' }
const makeService = (): AuthService => ({
  configured: true,
  getSession: vi.fn().mockResolvedValue({ ok: true, data: null }),
  signIn: vi.fn().mockResolvedValue({ ok: true, data: user }),
  signUp: vi.fn().mockResolvedValue({ ok: true, data: { message: 'Controlla la tua email.' } }),
  signOut: vi.fn().mockResolvedValue({ ok: true, data: null }),
  recoverPassword: vi.fn().mockResolvedValue({ ok: true, data: { message: 'Richiesta ricevuta.' } })
})
function authWrapper(service: AuthService) {
  return function Wrapper({ children }: { children: ReactNode }): React.JSX.Element {
    return (
      <LoadingProvider>
        <AuthProvider service={service}>{children}</AuthProvider>
      </LoadingProvider>
    )
  }
}
beforeEach(() => localStorage.clear())
afterEach(cleanup)

describe('base di autenticazione', () => {
  it('senza backend non crea account, non autentica e non modifica le credenziali locali', async () => {
    localStorage.setItem('build-inspector.accounts.v1', 'vecchi dati')
    const credentials = { email: user.email, password: 'password di test', remember: true }
    expect((await authService.signIn(credentials)).ok).toBe(false)
    expect((await authService.signUp({ ...credentials, name: user.name })).ok).toBe(false)
    expect((await authService.recoverPassword(user.email)).ok).toBe(false)
    expect(await authService.getSession()).toEqual({ ok: true, data: null })
    expect(localStorage.length).toBe(1)
    expect(localStorage.getItem('build-inspector.accounts.v1')).toBe('vecchi dati')
  })

  it('delega al servizio e mantiene solo in memoria l’utente restituito dal backend', async () => {
    const service = makeService()
    const { result } = renderHook(() => useAuth(), { wrapper: authWrapper(service) })
    await waitFor(() => expect(result.current.initializing).toBe(false))
    const credentials = { email: user.email, password: 'password di test', remember: true }
    await act(async () => {
      await result.current.signIn(credentials)
    })
    expect(service.signIn).toHaveBeenCalledWith(credentials)
    expect(result.current.user).toEqual(user)
    expect(localStorage.length).toBe(0)
    await act(async () => {
      await result.current.signOut()
    })
    expect(result.current.user).toBeNull()
  })

  it('registrazione e recupero non aprono una sessione e lasciano le istruzioni al server', async () => {
    const service = makeService()
    const { result } = renderHook(() => useAuth(), { wrapper: authWrapper(service) })
    await waitFor(() => expect(result.current.initializing).toBe(false))
    await act(async () => {
      expect(
        await result.current.signUp({ name: user.name, email: user.email, password: 'test' })
      ).toEqual({ ok: true, data: { message: 'Controlla la tua email.' } })
      expect(await result.current.recoverPassword(user.email)).toEqual({
        ok: true,
        data: { message: 'Richiesta ricevuta.' }
      })
    })
    expect(result.current.user).toBeNull()
    expect(service.recoverPassword).toHaveBeenCalledWith(user.email)
  })

  it('un errore di rete diventa un risultato gestibile e chiude il caricamento', async () => {
    const service = makeService()
    service.signIn = vi.fn().mockRejectedValue(new Error('offline'))
    const { result } = renderHook(() => ({ auth: useAuth(), loading: useLoading() }), {
      wrapper: authWrapper(service)
    })
    await waitFor(() => expect(result.current.auth.initializing).toBe(false))
    await act(async () => {
      expect(
        await result.current.auth.signIn({ email: user.email, password: 'test', remember: false })
      ).toEqual({ ok: false, message: 'Servizio non raggiungibile. Riprova tra un momento.' })
    })
    expect(result.current.auth.user).toBeNull()
    expect(result.current.loading.isLoading).toBe(false)
  })

  it('un logout fallito non finge di avere chiuso la sessione sul server', async () => {
    const service = makeService()
    service.getSession = vi.fn().mockResolvedValue({ ok: true, data: user })
    service.signOut = vi.fn().mockResolvedValue({ ok: false, message: 'Riprova' })
    const { result } = renderHook(() => useAuth(), { wrapper: authWrapper(service) })
    await waitFor(() => expect(result.current.user).toEqual(user))
    await act(async () => {
      expect((await result.current.signOut()).ok).toBe(false)
    })
    expect(result.current.user).toEqual(user)
  })
})

describe('attesa e tema', () => {
  it('attende tutte le operazioni contemporanee, anche quando una fallisce', async () => {
    const { result } = renderHook(() => useLoading(), { wrapper: LoadingProvider })
    let completeFirst!: (value: Result<number>) => void
    let completeSecond!: (value: Result<number>) => void
    const first = new Promise<Result<number>>((resolve) => {
      completeFirst = resolve
    })
    const second = new Promise<Result<number>>((resolve) => {
      completeSecond = resolve
    })
    let requests!: Promise<unknown[]>
    act(() => {
      requests = Promise.all([
        result.current.runWithLoading(() => first),
        result.current.runWithLoading(() => second)
      ])
    })
    expect(result.current.isLoading).toBe(true)
    await act(async () => {
      completeFirst({ ok: true, data: 1 })
      await first
    })
    expect(result.current.isLoading).toBe(true)
    await act(async () => {
      completeSecond({ ok: false, message: 'Errore' })
      await requests
    })
    expect(result.current.isLoading).toBe(false)
  })

  it('mostra l’attesa durante il ripristino della sessione e la rimuove alla fine', async () => {
    let finish!: (value: Result<null>) => void
    const service = makeService()
    service.getSession = () =>
      new Promise((resolve) => {
        finish = resolve
      })
    render(
      <LoadingProvider>
        <AuthProvider service={service}>
          <LoadingOverlay />
        </AuthProvider>
      </LoadingProvider>
    )
    expect(await screen.findByRole('dialog')).toBeTruthy()
    expect(screen.getByText('Verifica della sessione…')).toBeTruthy()
    await act(async () => {
      finish({ ok: true, data: null })
    })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('cambia tema e conserva la scelta', () => {
    const { result } = renderHook(() => useThemeMode())
    expect(result.current.mode).toBe('dark')
    act(() => result.current.toggleTheme())
    expect(result.current.mode).toBe('light')
    expect(localStorage.getItem('theme')).toBe('light')
    act(() => result.current.toggleTheme())
    expect(result.current.mode).toBe('dark')
  })
})
