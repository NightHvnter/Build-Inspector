import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { Library } from '../library'
import { LoadingProvider } from '../providers/LoadingProvider'
import { resetTopGamesCache } from '../hooks/useTopGames'
import { resetFavoriteGamesCache } from '../hooks/useFavoriteGames'

const search = vi.fn()
const top = vi.fn()
const details = vi.fn()
const topGenres = vi.fn()

const cover = (appId: number): string =>
  `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/header.jpg`
const chartGame = (appId: number, name: string, genres: string[]): object => ({
  appId,
  name,
  description: 'Descrizione di ' + name,
  genres,
  image: cover(appId)
})
// The week's chart as the API returns it.
const CHART = [
  chartGame(570, 'Dota 2', ['MOBA', 'Strategia']),
  chartGame(1091500, 'Cyberpunk 2077', ['RPG', 'Azione']),
  chartGame(1086940, "Baldur's Gate 3", ['RPG', 'Strategia']),
  chartGame(1245620, 'Elden Ring', ['RPG', 'Azione']),
  chartGame(730, 'Counter-Strike 2', ['Azione']),
  chartGame(413150, 'Stardew Valley', ['Simulazione'])
]

function Location(): React.JSX.Element {
  const location = useLocation()
  return <p data-testid="search">{location.search}</p>
}

function open(path = '/libreria', favoritesOnly = false): void {
  render(
    <LoadingProvider>
      <MemoryRouter initialEntries={[path]}>
        <Library favoritesOnly={favoritesOnly} />
        <Location />
      </MemoryRouter>
    </LoadingProvider>
  )
}

beforeEach(() => {
  resetTopGamesCache()
  resetFavoriteGamesCache()
  localStorage.clear()
  window.api = {
    account: {} as never,
    steam: { search, requirements: vi.fn(), top, topGenres, details }
  }
  top.mockResolvedValue({ ok: true, data: CHART })
  topGenres.mockResolvedValue({
    ok: true,
    data: ['RPG', 'Azione', 'Strategia', 'MOBA', 'Simulazione']
  })
})

afterEach(() => {
  cleanup()
  delete window.api
  search.mockReset()
  top.mockReset()
  details.mockReset()
  topGenres.mockReset()
})

it('shows the most played games of a genre when its chip is clicked', async () => {
  // The genre's chart goes deeper than the first page: The Witcher 3 isn't in it.
  const RPG = [CHART[1], CHART[2], CHART[3], chartGame(292030, 'The Witcher 3', ['RPG'])]
  top.mockImplementation(async (genre?: string) => ({ ok: true, data: genre ? RPG : CHART }))
  open()
  await screen.findByRole('heading', { name: 'Dota 2' })
  const genres = screen.getByRole('group', { name: 'Filtra per genere' })
  // The chips are the chart's most common genres.
  expect(
    within(genres)
      .getAllByRole('button')
      .map((b) => b.textContent)
  ).toEqual(['Tutti i generi', 'RPG', 'Azione', 'Strategia', 'MOBA', 'Simulazione'])
  fireEvent.click(within(genres).getByRole('button', { name: 'RPG' }))
  await waitFor(() => expect(screen.getByTestId('search').textContent).toBe('?genre=RPG'))
  expect(top).toHaveBeenLastCalledWith('RPG')
  await screen.findByRole('heading', { name: 'The Witcher 3' })
  expect(within(genres).getByRole('button', { name: 'RPG' }).getAttribute('aria-pressed')).toBe(
    'true'
  )
  expect(screen.getByRole('status').textContent).toBe('4 giochi')
  expect(screen.queryByRole('heading', { name: 'Dota 2' })).toBeNull()
  screen.getByText('I giochi RPG più giocati su Steam negli ultimi 7 giorni.')

  // The chip's delete icon removes just that filter.
  const active = screen.getByRole('button', { name: 'Genere: RPG' })
  fireEvent.click(active.querySelector('svg')!)
  await waitFor(() => expect(screen.getByTestId('search').textContent).toBe(''))
  expect(screen.getByRole('status').textContent).toBe('6 giochi')
})

it('splits a search into featured matches and Steam results, with loading cards first', async () => {
  let reply: (value: unknown) => void = () => {}
  search.mockReturnValue(new Promise((resolve) => (reply = resolve)))
  open('/libreria?q=cyber')

  const featured = await screen.findByRole('region', { name: 'Più giocati della settimana' })
  within(featured).getByRole('heading', { name: 'Cyberpunk 2077' })
  const steam = await screen.findByRole('region', { name: 'Risultati da Steam' })
  expect(steam.getAttribute('aria-busy')).toBe('true')
  // The search starts once typing has paused (350 ms).
  await waitFor(() => expect(search).toHaveBeenCalledWith('cyber'))

  reply({ ok: true, data: [{ appId: 2138330, name: 'Cyberpunk 2077: Phantom Liberty' }] })
  await within(steam).findByRole('heading', { name: 'Cyberpunk 2077: Phantom Liberty' })
  expect(steam.getAttribute('aria-busy')).toBe('false')
  // Steam results carry a badge on their cover.
  within(steam).getByText('Steam')
  expect(within(featured).queryByText('Steam')).toBeNull()
})

it('explains an empty result and offers to clear the filters', async () => {
  search.mockResolvedValue({ ok: true, data: [] })
  open('/libreria?q=zzzz')
  await screen.findByText('Nessun gioco trovato.')
  fireEvent.click(screen.getAllByRole('button', { name: 'Azzera i filtri' })[0])
  await waitFor(() => expect(screen.getByTestId('search').textContent).toBe(''))
})

it("shows Steam's most played games of the week, with their own genres", async () => {
  // Without the genres list, the chips come from the games shown.
  topGenres.mockResolvedValue({ ok: false, message: 'Generi non disponibili.' })
  let reply: (value: unknown) => void = () => {}
  top.mockReturnValue(new Promise((resolve) => (reply = resolve)))
  open()
  // Placeholder cards until the chart arrives.
  expect(screen.queryByRole('heading', { name: 'Dota 2' })).toBeNull()
  reply({
    ok: true,
    data: [
      {
        appId: 730,
        name: 'Counter-Strike 2',
        description: 'Sparatutto tattico.',
        genres: ['Azione', 'Free-to-Play'],
        image: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/730/header.jpg'
      },
      {
        appId: 2868840,
        name: 'Slay the Spire 2',
        description: 'Roguelike di carte.',
        genres: ['Indie', 'Strategia'],
        image:
          'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2868840/header.jpg'
      }
    ]
  })
  await screen.findByRole('heading', { name: 'Slay the Spire 2' })
  expect(screen.getByText(/più giocati su Steam negli ultimi 7 giorni/)).toBeTruthy()
  expect(screen.getByRole('status').textContent).toBe('2 giochi')
  expect(screen.queryByRole('heading', { name: 'Dota 2' })).toBeNull()
  const genres = screen.getByRole('group', { name: 'Filtra per genere' })
  expect(
    within(genres)
      .getAllByRole('button')
      .map((b) => b.textContent)
  ).toEqual(['Tutti i generi', 'Azione', 'Free-to-Play', 'Indie', 'Strategia'])

  // Searching splits them under the week's title.
  fireEvent.change(screen.getByRole('textbox', { name: 'Cerca un gioco' }), {
    target: { value: 'slay' }
  })
  await screen.findByRole('region', { name: 'Più giocati della settimana' })
})

it('says so when the chart is not available, without showing made-up games', async () => {
  top.mockResolvedValue({ ok: false, message: 'Classifica di Steam non disponibile.' })
  open()
  await screen.findByText('La classifica di Steam non è disponibile: cerca un gioco per nome.')
  expect(screen.getByRole('status').textContent).toBe('0 giochi')
})
