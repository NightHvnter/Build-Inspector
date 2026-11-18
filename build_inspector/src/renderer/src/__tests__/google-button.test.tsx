import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import { AuthForm } from '../components/auth/AuthForm'
import { AuthContext, type AuthContextValue } from '../contexts/AuthContext'
import { LoadingProvider } from '../providers/LoadingProvider'

afterEach(cleanup)

function open(auth: Partial<AuthContextValue>): void {
  const value: AuthContextValue = {
    user: null,
    initializing: false,
    configured: true,
    sessionError: '',
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    signInWithGoogle: vi.fn(),
    cancelBrowserSignIn: vi.fn().mockResolvedValue({ ok: true, data: null }),
    ...auth
  }
  render(
    <LoadingProvider>
      <AuthContext.Provider value={value}>
        <MemoryRouter initialEntries={['/login?next=%2Fcronologia']}>
          <Routes>
            <Route path="/login" element={<AuthForm mode="login" />} />
            <Route path="/cronologia" element={<p>Pagina cronologia</p>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    </LoadingProvider>
  )
}

it('waits for the browser, then opens the requested page', async () => {
  let finish: (value: unknown) => void = () => {}
  const signInWithGoogle = vi.fn(() => new Promise((resolve) => (finish = resolve)))
  open({ signInWithGoogle: signInWithGoogle as never })
  fireEvent.click(screen.getByRole('button', { name: 'Continua con Google' }))
  expect(signInWithGoogle).toHaveBeenCalledTimes(1)
  await screen.findByText(/Completa l’accesso con Google nel browser/)
  // The email/password form is locked meanwhile.
  expect((screen.getByRole('button', { name: 'Accedi' }) as HTMLButtonElement).disabled).toBe(true)
  finish({ ok: true, data: { id: '7', name: 'Mario', email: 'mario@example.com' } })
  await screen.findByText('Pagina cronologia')
})

it('can be cancelled and shows why it failed', async () => {
  let finish: (value: unknown) => void = () => {}
  const cancelBrowserSignIn = vi.fn(async () => {
    finish({ ok: false, message: 'Accesso con Google annullato.' })
    return { ok: true as const, data: null }
  })
  open({
    signInWithGoogle: vi.fn(() => new Promise((resolve) => (finish = resolve))) as never,
    cancelBrowserSignIn
  })
  fireEvent.click(screen.getByRole('button', { name: 'Continua con Google' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Annulla' }))
  expect(cancelBrowserSignIn).toHaveBeenCalledTimes(1)
  await screen.findByText('Accesso con Google annullato.')
  await waitFor(() =>
    expect(
      (screen.getByRole('button', { name: 'Continua con Google' }) as HTMLButtonElement).disabled
    ).toBe(false)
  )
})
