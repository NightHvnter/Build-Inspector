import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { Library } from '../library'
import { LoadingProvider } from '../providers/LoadingProvider'
import { resetTopGamesCache } from '../hooks/useTopGames'

const search = vi.fn()
const top = vi.fn()

function Location(): React.JSX.Element {
  const location = useLocation()
  return <p data-testid="search">{location.search}</p>
}

function open(path = '/libreria'): void {
  render(
    <LoadingProvider>
      <MemoryRouter initialEntries={[path]}>
        <Library />
        <Location />
      </MemoryRouter>
    </LoadingProvider>
  )
}

beforeEach(() => {
  resetTopGamesCache()
  window.api = { account: {} as never, steam: { search, requirements: vi.fn(), top } }
  // Without the week's chart the catalog shows its built-in games.
  top.mockResolvedValue({ ok: false, message: 'Classifica di Steam non disponibile.' })
})

afterEach(() => {
  cleanup()
  delete window.api
  search.mockReset()
  top.mockReset()
})

it('filters by genre with the chips and shows the filter as a removable chip', async () => {
  open()
  await screen.findByRole('heading', { name: 'Dota 2' })
  const genres = screen.getByRole('group', { name: 'Filtra per genere' })
  fireEvent.click(within(genres).getByRole('button', { name: 'RPG' }))
  await waitFor(() => expect(screen.getByTestId('search').textContent).toBe('?genre=RPG'))
  expect(within(genres).getByRole('button', { name: 'RPG' }).getAttribute('aria-pressed')).toBe(
    'true'
  )
  expect(screen.getByRole('status').textContent).toBe('3 giochi')
  expect(screen.queryByRole('heading', { name: 'Dota 2' })).toBeNull()

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

  const featured = await screen.findByRole('region', { name: 'In evidenza' })
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
