import { Button, Paper, Stack, Typography } from '@mui/material'
import type { JSX } from 'react'
export function EmptyState({
  title,
  description,
  onReset
}: {
  title: string
  description: string
  onReset?: () => void
}): JSX.Element {
  return (
    <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
      <Stack spacing={1.5} sx={{ alignItems: 'center' }}>
        <Typography variant="h6">{title}</Typography>
        <Typography color="text.secondary">{description}</Typography>
        {onReset && (
          <Button onClick={onReset} variant="outlined">
            Azzera i filtri
          </Button>
        )}
      </Stack>
    </Paper>
  )
}
