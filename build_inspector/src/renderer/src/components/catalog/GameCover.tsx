import { useState, type JSX } from 'react'
import { Box, CardMedia, Chip, Stack, Typography } from '@mui/material'
import type { Game } from '../../games'
import { Icon } from '../Icon'

// badge: a short label over the image's corner, e.g. "Steam" for search results.
export function GameCover({ game, badge }: { game: Game; badge?: string }): JSX.Element {
  const [failed, setFailed] = useState(false)
  return (
    <Box
      sx={{
        position: 'relative',
        aspectRatio: '460 / 215',
        bgcolor: 'action.hover',
        overflow: 'hidden'
      }}
    >
      {failed ? (
        <Stack
          spacing={1}
          sx={{ alignItems: 'center', justifyContent: 'center', height: '100%', p: 2 }}
        >
          <Icon name="game" size={36} />
          <Typography>{game.title}</Typography>
        </Stack>
      ) : (
        <CardMedia
          component="img"
          image={game.image}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
      {badge && (
        <Chip
          label={badge}
          size="small"
          sx={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            bgcolor: '#25262be6',
            color: '#fff',
            borderRadius: 1,
            fontSize: 11,
            fontWeight: 600
          }}
        />
      )}
    </Box>
  )
}
