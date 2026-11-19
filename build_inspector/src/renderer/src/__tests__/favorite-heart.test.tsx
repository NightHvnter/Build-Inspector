import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import { FAVORITE_RED, GameCard } from '../components/catalog/GameCard'
import { GameDetails } from '../components/catalog/GameDetails'
import type { Game } from '../games'

const GAME: Game = {
  id: 730,
  title: 'Counter-Strike 2',
  image: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/730/header.jpg',
  genre: ['Azione'],
  description: 'Sparatutto tattico.'
}

afterEach(cleanup)

// jsdom reports colours as rgb(); FAVORITE_RED is #ff4d5e.
const RED = 'rgb(255, 77, 94)'

function heartIn(element: HTMLElement): { fill: string | null; color: string } {
  const svg = element.querySelector('svg')!
  return { fill: svg.getAttribute('fill'), color: getComputedStyle(svg).color }
}

it('shows a solid red heart on a favorite card and an outline otherwise', () => {
  expect(FAVORITE_RED).toBe('#ff4d5e')
  const game = GAME
  const { rerender } = render(
    <GameCard game={game} favorite onOpen={() => {}} onFavorite={() => {}} />
  )
  const button = screen.getByRole('button', { name: `Rimuovi ${game.title} dai preferiti` })
  expect(button.getAttribute('aria-pressed')).toBe('true')
  expect(heartIn(button)).toEqual({ fill: 'currentColor', color: RED })

  rerender(<GameCard game={game} favorite={false} onOpen={() => {}} onFavorite={() => {}} />)
  const outline = screen.getByRole('button', { name: `Aggiungi ${game.title} ai preferiti` })
  expect(outline.getAttribute('aria-pressed')).toBe('false')
  expect(heartIn(outline).fill).toBe('none')
})

it('uses the same heart on the dialog’s favorite button', () => {
  window.api = {
    account: {} as never,
    steam: { search: vi.fn(), requirements: vi.fn(() => new Promise(() => {})) }
  } as never
  render(
    <MemoryRouter>
      <GameDetails game={GAME} favorite onClose={() => {}} onFavorite={() => {}} />
    </MemoryRouter>
  )
  const button = screen.getByRole('button', { name: 'Rimuovi dai preferiti' })
  expect(heartIn(button)).toEqual({ fill: 'currentColor', color: RED })
  delete window.api
})
