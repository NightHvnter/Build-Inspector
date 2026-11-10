import type { JSX } from 'react'
import { Box, Button, Typography } from '@mui/material'
import { Link } from 'react-router-dom'

export function PreRegistrazione({ isLoggedIn }: { isLoggedIn: boolean }): JSX.Element {
  return (
    <Box component="section" sx={{ mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Libreria giochi
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Sfoglia i giochi e consulta i requisiti. Nel pannello puoi inserire i componenti del tuo PC.
      </Typography>
      <Button
        component={Link}
        to={isLoggedIn ? '/configurazione' : '/registrazione?next=%2Fconfigurazione'}
        variant="outlined"
      >
        {isLoggedIn ? 'Apri la mia configurazione' : 'Registrati per salvare la configurazione'}
      </Button>
    </Box>
  )
}
