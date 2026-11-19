import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { steamGame, useSteamSearch } from '../hooks/useSteamSearch'

const search = vi.fn()

beforeEach(() => {
  vi.useFakeTimers()
  window.api = {
    account: {} as never,
    steam: { search, requirements: vi.fn(), top: vi.fn(), topGenres: vi.fn(), details: vi.fn() }
  }
})

afterEach(() => {
  vi.useRealTimers()
  delete window.api
  search.mockReset()
})

it('asks Steam once the user stops typing and shows the matches as games', async () => {
  search.mockResolvedValue({ ok: true, data: [{ appId: 620, name: 'Portal 2' }] })
  const { result, rerender } = renderHook(({ term }) => useSteamSearch(term, true), {
    initialProps: { term: 'por' }
  })
  rerender({ term: 'portal' })
  expect(result.current.loading).toBe(true)
  await act(() => vi.advanceTimersByTimeAsync(400))
  expect(search).toHaveBeenCalledTimes(1)
  expect(search).toHaveBeenCalledWith('portal')
  expect(result.current).toEqual({
    games: [steamGame(620, 'Portal 2')],
    loading: false,
    error: null
  })
})

it('shows the error message when the search fails', async () => {
  search.mockResolvedValue({ ok: false, message: 'Servizio Steam non raggiungibile.' })
  const { result } = renderHook(() => useSteamSearch('dota', true))
  await act(() => vi.advanceTimersByTimeAsync(400))
  expect(result.current).toEqual({
    games: [],
    loading: false,
    error: 'Servizio Steam non raggiungibile.'
  })
})

it('does not search for one letter, when disabled, or without the preload bridge', async () => {
  renderHook(() => useSteamSearch('d', true))
  renderHook(() => useSteamSearch('dota', false))
  await act(() => vi.advanceTimersByTimeAsync(400))
  delete window.api
  const { result } = renderHook(() => useSteamSearch('dota', true))
  await act(() => vi.advanceTimersByTimeAsync(400))
  expect(search).not.toHaveBeenCalled()
  expect(result.current).toEqual({ games: [], loading: false, error: null })
})

it('builds the Steam cover address from the app id', () => {
  expect(steamGame(570, 'Dota 2').image).toBe(
    'https://cdn.akamai.steamstatic.com/steam/apps/570/header.jpg'
  )
})
