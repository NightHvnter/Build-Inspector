import { CircularProgress, Dialog, DialogContent, Stack, Typography } from '@mui/material'
import type { JSX } from 'react'
import { useLoading } from '../../hooks/useLoading'

export function LoadingOverlay(): JSX.Element {
  const { isLoading, message } = useLoading()
  return (
    <Dialog open={isLoading} aria-labelledby="loading-message" maxWidth="xs" fullWidth>
      <DialogContent>
        <Stack
          direction="row"
          spacing={2}
          role="status"
          aria-live="polite"
          sx={{ alignItems: 'center', py: 1 }}
        >
          <CircularProgress size={26} aria-label="Caricamento" />
          <Typography id="loading-message">{message}</Typography>
        </Stack>
      </DialogContent>
    </Dialog>
  )
}
