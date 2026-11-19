import type { TopGame } from '@shared/types/steam'

// A Steam game as a catalog card. Every game comes from Steam: the week's most played,
// a search result or a favourite loaded by id. Requirements are loaded when it is opened.
export interface Game {
  id: number // the Steam app id
  title: string
  image: string
  genre: string[]
  description: string
  // True for games found by searching Steam, as opposed to the week's most played.
  fromSteamSearch?: boolean
}

// A game's card data from the API as a catalog card.
export function toGame(game: TopGame): Game {
  return {
    id: game.appId,
    title: game.name,
    image: game.image,
    genre: game.genres.slice(0, 3),
    description: game.description
  }
}
