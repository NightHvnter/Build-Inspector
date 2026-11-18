import { Box, Button, Paper, Stack, Typography } from '@mui/material'
import type { JSX } from 'react'
import { Icon } from '../Icon'

export function EmptyState({
  title,
  description,
  onReset,
  icon = 'search'
}: {
  title: string
  description: string
  onReset?: () => void
  icon?: Parameters<typeof Icon>[0]['name']
}): JSX.Element {
  return (
    <Paper variant="outlined" sx={{ p: { xs: 4, md: 6 }, textAlign: 'center', borderRadius: 2 }}>
      <Stack spacing={1.5} sx={{ alignItems: 'center' }}>
        <Box
          aria-hidden
          sx={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            bgcolor: 'action.hover',
            color: 'text.secondary',
            mb: 0.5
          }}
        >
          <Icon name={icon} size={26} />
        </Box>
        <Typography variant="h6">{title}</Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 420 }}>
          {description}
        </Typography>
        {onReset && (
          <Button onClick={onReset} variant="outlined" sx={{ mt: 1 }}>
            Azzera i filtri
          </Button>
        )}
      </Stack>
    </Paper>
  )
}
