import {
  Card,
  CardActionArea,
  CardContent,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography
} from '@mui/material'
import type { JSX } from 'react'
import type { Game } from '../../games'
import { Icon } from '../Icon'
import { GameCover } from './GameCover'

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
      sx={{ position: 'relative', height: '100%', '&:hover': { borderColor: 'primary.main' } }}
    >
      <CardActionArea
        onClick={onOpen}
        aria-label={'Scopri ' + game.title}
        sx={{ height: '100%', display: 'block' }}
      >
        <GameCover game={game} />
        <CardContent>
          <Typography variant="caption" color="text.secondary">
            {game.genre.slice(0, 2).join(' / ')}
          </Typography>
          <Typography component="h3" variant="h6" sx={{ my: 1 }}>
            {game.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ minHeight: 44, mb: 2 }}>
            {game.description}
          </Typography>
          <Divider />
          <Stack
            direction="row"
            sx={{ justifyContent: 'space-between', pt: 1.5, color: 'primary.main' }}
          >
            <Typography variant="body2">Vedi requisiti</Typography>
            <Icon name="arrow" size={18} />
          </Stack>
        </CardContent>
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
            color: favorite ? '#ffa6b7' : '#fff',
            borderRadius: 1,
            '&:hover': { bgcolor: '#25262b' }
          }}
        >
          <Icon name="heart" size={19} />
        </IconButton>
      </Tooltip>
    </Card>
  )
}
