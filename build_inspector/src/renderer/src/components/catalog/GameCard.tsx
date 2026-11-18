import {
  Box,
  Card,
  CardActionArea,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography
} from '@mui/material'
import type { JSX } from 'react'
import type { Game } from '../../games'
import { Icon } from '../Icon'
import { GameCover } from './GameCover'

// Bright enough on the cards' dark button and on the light theme alike.
export const FAVORITE_RED = '#ff4d5e'

export function GameCard({
  game,
  favorite,
  onOpen,
  onFavorite
}: {
  game: Game
  favorite: boolean
  onOpen: () => void
  onFavorite: () => void
}): JSX.Element {
  const favoriteLabel =
    (favorite ? 'Rimuovi ' : 'Aggiungi ') + game.title + (favorite ? ' dai' : ' ai') + ' preferiti'
  return (
    <Card
      component="article"
      variant="outlined"
      sx={{
        position: 'relative',
        height: '100%',
        borderRadius: 2,
        transition: 'transform 150ms ease, border-color 150ms ease, box-shadow 150ms ease',
        '&:hover': {
          borderColor: 'primary.main',
          transform: 'translateY(-2px)',
          boxShadow: 4
        },
        '@media (prefers-reduced-motion: reduce)': {
          transition: 'none',
          '&:hover': { transform: 'none' }
        }
      }}
    >
      <CardActionArea
        onClick={onOpen}
        aria-label={'Scopri ' + game.title}
        sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
      >
        <GameCover game={game} badge={game.fromSteamSearch ? 'Steam' : undefined} />
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', flex: 1, gap: 1 }}>
          {game.genre.length > 0 && (
            <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap' }}>
              {game.genre.slice(0, 3).map((genre) => (
                <Chip
                  key={genre}
                  label={genre}
                  size="small"
                  variant="outlined"
                  sx={{ height: 22, fontSize: 11.5 }}
                />
              ))}
            </Stack>
          )}
          <Typography component="h3" variant="h6" sx={{ lineHeight: 1.3 }}>
            {game.title}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              flex: 1
            }}
          >
            {game.description}
          </Typography>
          <Stack
            direction="row"
            spacing={0.75}
            sx={{ alignItems: 'center', color: 'primary.main', pt: 1 }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Vedi requisiti
            </Typography>
            <Icon name="arrow" size={16} />
          </Stack>
        </Box>
      </CardActionArea>
      <Tooltip title={favoriteLabel}>
        <IconButton
          onClick={onFavorite}
          aria-label={favoriteLabel}
          aria-pressed={favorite}
          size="small"
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            bgcolor: '#25262be6',
            // A solid red heart for favorites, an outline otherwise.
            color: favorite ? FAVORITE_RED : '#fff',
            borderRadius: 1.5,
            '&:hover': { bgcolor: '#25262b' }
          }}
        >
          <Icon name="heart" size={19} filled={favorite} />
        </IconButton>
      </Tooltip>
    </Card>
  )
}
