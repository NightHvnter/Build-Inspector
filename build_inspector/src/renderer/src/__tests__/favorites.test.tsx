import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useFavorites } from '../hooks/useFavorites'
import { resetFavoriteGamesCache, useFavoriteGames } from '../hooks/useFavoriteGames'

const list = vi.fn()
const add = vi.fn()
const remove = vi.fn()

function withApi(): void {
  window.api = { account: {} as never, steam: {} as never, favorites: { list, add, remove } }
}

beforeEach(() => {
  localStorage.clear()
  list.mockResolvedValue({ ok: true, data: [730] })
  add.mockImplementation(async (ids: number[]) => ({ ok: true, data: [730, ...ids] }))
  remove.mockResolvedValue({ ok: true, data: [] })
})

afterEach(() => {
  cleanup()
  delete window.api
  vi.clearAllMocks()
})

it('keeps any Steam game on the device, not only the built-in ones', () => {
  // 2357570 was not in the old built-in list: it used to wipe the whole list on the next start.
  localStorage.setItem('bi.favorites.7', JSON.stringify([730, 2357570]))
  const { result } = renderHook(() => useFavorites('7'))
  expect(result.current.favorites).toEqual([730, 2357570])
})

it('loads the favourites from the database', async () => {
  withApi()
  const { result } = renderHook(() => useFavorites('7'))
  expect(result.current.loading).toBe(true)
  await waitFor(() => expect(result.current.loading).toBe(false))
  expect(result.current.favorites).toEqual([730])
  expect(list).toHaveBeenCalledTimes(1)
})

it('moves favourites saved on the device to the database once', async () => {
  withApi()
  localStorage.setItem('bi.favorites.7', JSON.stringify([2357570]))
  const { result } = renderHook(() => useFavorites('7'))
  await waitFor(() => expect(result.current.favorites).toEqual([730, 2357570]))
  expect(add).toHaveBeenCalledWith([2357570])
  expect(list).not.toHaveBeenCalled()
  expect(localStorage.getItem('bi.favorites.7')).toBeNull()
})

it('keeps the device copy when the move fails', async () => {
  withApi()
  add.mockResolvedValue({ ok: false, message: 'La sessione è scaduta.' })
  localStorage.setItem('bi.favorites.7', JSON.stringify([2357570]))
  const { result } = renderHook(() => useFavorites('7'))
  await waitFor(() => expect(result.current.error).toBe('La sessione è scaduta.'))
  expect(localStorage.getItem('bi.favorites.7')).toBe('[2357570]')
})

it('saves a toggle to the database', async () => {
  withApi()
  const { result } = renderHook(() => useFavorites('7'))
  await waitFor(() => expect(result.current.loading).toBe(false))
  await act(async () => result.current.toggleFavorite(570))
  expect(add).toHaveBeenCalledWith([570])
  expect(result.current.favorites).toEqual([730, 570])
  await act(async () => result.current.toggleFavorite(730))
  expect(remove).toHaveBeenCalledWith(730)
  expect(localStorage.getItem('bi.favorites.7')).toBeNull()
})

it('puts the heart back when the database refuses', async () => {
  withApi()
  const { result } = renderHook(() => useFavorites('7'))
  await waitFor(() => expect(result.current.loading).toBe(false))
  add.mockResolvedValue({ ok: false, message: 'Puoi avere al massimo 500 preferiti.' })
  await act(async () => result.current.toggleFavorite(570))
  expect(result.current.favorites).toEqual([730])
  expect(result.current.error).toBe('Puoi avere al massimo 500 preferiti.')
})

it('does nothing for a guest', () => {
  withApi()
  const { result } = renderHook(() => useFavorites(undefined))
  act(() => result.current.toggleFavorite(570))
  expect(result.current.favorites).toEqual([])
  expect(list).not.toHaveBeenCalled()
  expect(add).not.toHaveBeenCalled()
})

const card = (appId: number, name: string): object => ({
  appId,
  name,
  description: '',
  genres: ['Azione'],
  image: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/header.jpg`
})

it('loads the favourite games by id, in order, and only once', async () => {
  resetFavoriteGamesCache()
  const details = vi.fn().mockResolvedValue({
    ok: true,
    data: [card(2357570, 'Overwatch 2'), card(730, 'Counter-Strike 2')]
  })
  window.api = { account: {} as never, steam: { details } as never }
  const first = renderHook(() => useFavoriteGames([730, 2357570, 999], true))
  expect(first.result.current.loading).toBe(true)
  await waitFor(() => expect(first.result.current.loading).toBe(false))
  // In the favourites' order; 999 is unknown to Steam and left out.
  expect(first.result.current.games.map((game) => [game.id, game.title])).toEqual([
    [730, 'Counter-Strike 2'],
    [2357570, 'Overwatch 2']
  ])
  expect(details).toHaveBeenCalledWith([730, 2357570, 999])
  first.unmount()

  // Opening the page again uses what was loaded, unknown ids included.
  const again = renderHook(() => useFavoriteGames([730, 2357570, 999], true))
  expect(again.result.current.loading).toBe(false)
  expect(again.result.current.games).toHaveLength(2)
  expect(details).toHaveBeenCalledTimes(1)
})

it('reports when the games cannot be loaded', async () => {
  resetFavoriteGamesCache()
  const details = vi.fn().mockResolvedValue({ ok: false, message: 'Dettagli non disponibili.' })
  window.api = { account: {} as never, steam: { details } as never }
  const { result } = renderHook(() => useFavoriteGames([730], true))
  await waitFor(() => expect(result.current.error).toBe('Dettagli non disponibili.'))
  expect(result.current.games).toEqual([])
})
