import { cleanup, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { HomePage } from '../home'
import { HomeIntro } from '../components/home/HomeIntro'
import { RecentComparisons } from '../components/home/RecentComparisons'
import { AuthProvider } from '../providers/AuthProvider'
import { LoadingProvider } from '../providers/LoadingProvider'
import { authService } from '../services/authService'
import { resetTopGamesCache } from '../hooks/useTopGames'

const top = vi.fn()
const cover = (appId: number): string =>
  `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/header.jpg`
const game = (appId: number, name: string): object => ({
  appId,
  name,
  description: 'Descrizione di ' + name,
  genres: ['Azione'],
  image: cover(appId)
})

beforeEach(() => {
  resetTopGamesCache()
  localStorage.clear()
  window.api = {
    account: {} as never,
    steam: {
      search: vi.fn(),
      requirements: vi.fn(),
      top,
      topGenres: vi.fn().mockResolvedValue({ ok: true, data: [] }),
      details: vi.fn()
    }
  }
  top.mockResolvedValue({
    ok: true,
    data: [game(730, 'Counter-Strike 2'), game(570, 'Dota 2'), game(1091500, 'Cyberpunk 2077')]
  })
})

afterEach(() => {
  cleanup()
  delete window.api
  top.mockReset()
})

it('puts the game catalog right under a short intro', async () => {
  render(
    <LoadingProvider>
      <AuthProvider service={authService}>
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </AuthProvider>
    </LoadingProvider>
  )
  screen.getByRole('heading', { level: 1, name: /pronto per i tuoi giochi/ })
  const steps = screen.getByRole('list', { name: 'Come funziona' })
  expect(
    within(steps)
      .getAllByRole('listitem')
      .map((step) => step.textContent)
  ).toEqual(['1Scegli un gioco', '2Scansiona il tuo PC', '3Leggi il report'])
  // Guests are offered an account; the catalog is there already.
  screen.getByRole('link', { name: 'Crea un account gratuito' })
  screen.getByRole('heading', { level: 2, name: 'Catalogo giochi' })
  await screen.findByRole('heading', { name: 'Cyberpunk 2077' })
  expect(screen.getAllByRole('article')).toHaveLength(3)
})

it('greets a signed-in user and links to their build', () => {
  render(
    <MemoryRouter>
      <HomeIntro user={{ id: '7', name: 'Giulia', email: 'giulia@example.com' }} />
    </MemoryRouter>
  )
  screen.getByText('Ciao, Giulia')
  expect(screen.getByRole('link', { name: 'La mia build' }).getAttribute('href')).toBe(
    '/configurazione'
  )
  expect(screen.queryByRole('link', { name: 'Crea un account gratuito' })).toBeNull()
})

const entry = (id: number, appId: number, gameName: string, failed: number): object => ({
  id,
  appId,
  gameName,
  cpuName: null,
  gpuName: null,
  ramGb: 32,
  met: 4 - failed,
  failed,
  toCheck: 0,
  date: '2026-11-18T10:00:00.000Z'
})

it('lists the latest comparisons with their verdict', async () => {
  window.api!.history = {
    list: vi.fn().mockResolvedValue({
      ok: true,
      data: [entry(1, 1091500, 'Cyberpunk 2077', 0), entry(2, 1245620, 'Elden Ring', 1)]
    }),
    record: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn()
  }
  render(
    <MemoryRouter>
      <RecentComparisons />
    </MemoryRouter>
  )
  const cyberpunk = await screen.findByRole('link', { name: /Cyberpunk 2077/ })
  expect(cyberpunk.getAttribute('href')).toBe('/confronto/1091500')
  within(cyberpunk).getByText('Compatibile')
  within(screen.getByRole('link', { name: /Elden Ring/ })).getByText('Non compatibile')
})

it('shows nothing before the first comparison', async () => {
  const list = vi.fn().mockResolvedValue({ ok: true, data: [] })
  window.api!.history = { list, record: vi.fn(), remove: vi.fn(), clear: vi.fn() }
  const { container } = render(
    <MemoryRouter>
      <RecentComparisons />
    </MemoryRouter>
  )
  await vi.waitFor(() => expect(list).toHaveBeenCalled())
  expect(container.textContent).toBe('')
})
