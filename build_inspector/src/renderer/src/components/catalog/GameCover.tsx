import { useState, type JSX } from 'react'
import { Box, CardMedia, Chip, Stack, Typography } from '@mui/material'
import type { Game } from '../../games'
import { Icon } from '../Icon'

export function GameCover({ game }: { game: Game }): JSX.Element {
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
      <Chip
        label="PC"
        size="small"
        sx={{
          position: 'absolute',
          bottom: 8,
          left: 8,
          bgcolor: '#25262be6',
          color: '#fff',
          borderRadius: 1,
          fontSize: 11
        }}
      />
    </Box>
  )
}
