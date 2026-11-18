import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { ThemeProvider, Typography } from '@mui/material'
import { AppRoutes } from '../AppRoutes'
import { LoadingProvider } from '../providers/LoadingProvider'
import { AuthProvider } from '../providers/AuthProvider'
import { createAppTheme } from '../theme'
import { authService, type AuthService } from '../services/authService'
import { validateAuthForm } from '../utils/authValidation'
import { getAuthDestination } from '../utils/authNavigation'

function LocationProbe(): React.JSX.Element {
  const location = useLocation()
  return <Typography data-testid="route">{location.pathname + location.search}</Typography>
}
function renderRoute(path: string, service: AuthService = authService): void {
  render(
    <ThemeProvider theme={createAppTheme('dark')}>
      <LoadingProvider>
        <AuthProvider service={service}>
          <MemoryRouter initialEntries={[path]}>
            <AppRoutes mode="dark" toggleTheme={() => {}} />
            <LocationProbe />
          </MemoryRouter>
        </AuthProvider>
      </LoadingProvider>
    </ThemeProvider>
  )
}
beforeEach(() => {
  localStorage.clear()
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
})
afterEach(cleanup)

it('protegge i link diretti e conserva la destinazione tra login e registrazione', async () => {
  renderRoute('/configurazione')
  await waitFor(() =>
    expect(screen.getByTestId('route').textContent).toBe('/login?next=%2Fconfigurazione')
  )
  fireEvent.click(screen.getByRole('tab', { name: 'Registrati' }))
  await waitFor(() =>
    expect(screen.getByTestId('route').textContent).toBe('/registrazione?next=%2Fconfigurazione')
  )
  expect(screen.getByRole('heading', { name: 'Registrazione' })).toBeTruthy()
})

it('torna alla pagina richiesta solo dopo una risposta positiva del backend', async () => {
  const service: AuthService = {
    ...authService,
    configured: true,
    signIn: vi
      .fn()
      .mockResolvedValue({ ok: true, data: { id: '42', name: 'Test', email: 'test@example.com' } })
  }
  renderRoute('/login?next=%2Fconfigurazione', service)
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Accedi' }).hasAttribute('disabled')).toBe(false)
  )
  fireEvent.change(screen.getByRole('textbox', { name: 'Indirizzo email' }), {
    target: { value: 'test@example.com' }
  })
  fireEvent.change(screen.getByLabelText('Password', { exact: false, selector: 'input' }), {
    target: { value: 'password di test' }
  })
  fireEvent.click(screen.getByRole('button', { name: 'Accedi' }))
  await waitFor(() => expect(screen.getByTestId('route').textContent).toBe('/configurazione'))
  expect(screen.getByRole('heading', { name: 'La mia configurazione' })).toBeTruthy()
})

it('senza backend mostra un errore nel form e resta sulla pagina di accesso', async () => {
  renderRoute('/login')
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Accedi' }).hasAttribute('disabled')).toBe(false)
  )
  fireEvent.change(screen.getByRole('textbox', { name: 'Indirizzo email' }), {
    target: { value: 'test@example.com' }
  })
  fireEvent.change(screen.getByLabelText('Password', { exact: false, selector: 'input' }), {
    target: { value: 'password di test' }
  })
  fireEvent.click(screen.getByRole('button', { name: 'Accedi' }))
  expect(await screen.findByText('Per usare il servizio account, apri l’app desktop.')).toBeTruthy()
  expect(screen.getByTestId('route').textContent).toBe('/login')
  expect(localStorage.length).toBe(0)
})

it('ripristina ricerca e ordinamento dalla URL e gestisce le pagine sconosciute', async () => {
  renderRoute('/libreria?q=Cyberpunk&sort=alphabetical')
  expect(await screen.findByRole('heading', { name: 'Cyberpunk 2077' })).toBeTruthy()
  expect(screen.queryByRole('heading', { name: 'Dota 2' })).toBeNull()
  cleanup()
  renderRoute('/pagina-inesistente')
  expect(screen.getByRole('heading', { name: 'Pagina non trovata' })).toBeTruthy()
})

it('chiede l’accesso prima del confronto con il PC', async () => {
  renderRoute('/confronto/1091500')
  await waitFor(() =>
    expect(screen.getByTestId('route').textContent).toBe('/login?next=%2Fconfronto%2F1091500')
  )
})

it('non accetta destinazioni esterne e controlla la conferma password', () => {
  expect(getAuthDestination('?next=https://example.com')).toBe('/libreria')
  expect(getAuthDestination('?next=%2Fpreferiti')).toBe('/preferiti')
  expect(getAuthDestination('?next=%2Fconfronto%2F1091500')).toBe('/confronto/1091500')
  expect(getAuthDestination('?next=%2Fconfronto%2F..%2Flogin')).toBe('/libreria')
  expect(getAuthDestination('?next=%2Fconfronto%2F1%2Fextra')).toBe('/libreria')
  expect(
    validateAuthForm('register', {
      name: 'Test',
      email: 'test@example.com',
      password: 'uno',
      confirmPassword: 'due'
    })
  ).toEqual({ confirmPassword: 'Le password non coincidono.' })
})

it('la pagina di recupero spiega il limite senza chiedere una email', async () => {
  renderRoute('/recupera-password?next=%2Fconfigurazione')
  expect(
    await screen.findByText(/non è disponibile il recupero della password via email/)
  ).toBeTruthy()
  expect(screen.queryByRole('textbox')).toBeNull()
  fireEvent.click(screen.getByRole('link', { name: 'Torna al login' }))
  expect(screen.getByTestId('route').textContent).toBe('/login?next=%2Fconfigurazione')
})

it('si apre sulla Home, prima voce del menu, e la libreria mostra solo il catalogo', async () => {
  renderRoute('/')
  await waitFor(() => expect(screen.getByTestId('route').textContent).toBe('/home'))
  expect(
    screen.getByRole('heading', { name: 'Scopri se il tuo PC è pronto per i tuoi giochi.' })
  ).toBeTruthy()
  const menu = screen.getByRole('navigation', { name: 'Pagine' })
  const links = within(menu).getAllByRole('link')
  expect(links[0].textContent).toBe('Home')
  expect(links[0].getAttribute('href')).toBe('/home')

  fireEvent.click(within(menu).getByRole('link', { name: 'Esplora giochi' }))
  await screen.findByRole('heading', { name: 'Catalogo giochi' })
  expect(screen.queryByRole('heading', { name: /Scopri se il tuo PC/ })).toBeNull()
})

it('porta al catalogo dal pulsante della Home', async () => {
  renderRoute('/home')
  fireEvent.click(await screen.findByRole('link', { name: 'Esplora il catalogo' }))
  await waitFor(() => expect(screen.getByTestId('route').textContent).toBe('/libreria'))
  await screen.findByRole('heading', { name: 'Catalogo giochi' })
})
