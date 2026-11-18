import type { JSX } from 'react'
import { Box, Button, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Link } from 'react-router-dom'
import { Icon } from './components/Icon'

const STEPS = [
  {
    icon: 'game',
    title: 'Scegli un gioco',
    text: 'Requisiti minimi aggiornati, direttamente da Steam.'
  },
  {
    icon: 'chip',
    title: 'Scansiona il tuo PC',
    text: 'Processore, scheda video, RAM e spazio libero, rilevati in automatico.'
  },
  {
    icon: 'check',
    title: 'Confronta',
    text: 'Vedi subito cosa è sufficiente e cosa no, con i punteggi PassMark.'
  }
] as const

// The home page's opening section: what the app does, and where to go next.
export function PreRegistrazione({ isLoggedIn }: { isLoggedIn: boolean }): JSX.Element {
  return (
    <Paper
      component="section"
      variant="outlined"
      aria-labelledby="home-title"
      sx={(theme) => ({
        position: 'relative',
        overflow: 'hidden',
        mb: 5,
        p: { xs: 3, md: 5 },
        borderRadius: 3,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.16)} 0%, ${alpha(
          theme.palette.primary.main,
          0.04
        )} 45%, ${theme.palette.background.paper} 100%)`
      })}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1.15fr 1fr' },
          gap: { xs: 4, lg: 6 },
          alignItems: 'center'
        }}
      >
        <Box>
          <Typography
            variant="overline"
            color="primary"
            sx={{ fontWeight: 700, letterSpacing: 1.2, display: 'block', mb: 1 }}
          >
            Build Inspector
          </Typography>
          <Typography
            id="home-title"
            component="h1"
            sx={{
              fontSize: { xs: 28, md: 36 },
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: -0.5,
              mb: 2
            }}
          >
            Scopri se il tuo PC è pronto per i tuoi giochi.
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: 16, maxWidth: 520, mb: 3 }}>
            Confronta i requisiti minimi dei giochi Steam con i componenti del tuo computer, prima
            di acquistare o aggiornare.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            {isLoggedIn ? (
              <>
                <Button
                  component={Link}
                  to="/configurazione"
                  variant="contained"
                  size="large"
                  endIcon={<Icon name="arrow" size={18} />}
                >
                  Apri la mia build
                </Button>
                <Button component={Link} to="/cronologia" size="large" color="inherit">
                  Vedi la cronologia
                </Button>
              </>
            ) : (
              <>
                <Button
                  component={Link}
                  to="/registrazione?next=%2Fconfigurazione"
                  variant="contained"
                  size="large"
                  endIcon={<Icon name="arrow" size={18} />}
                >
                  Crea un account gratuito
                </Button>
                <Button
                  component={Link}
                  to="/login?next=%2Fconfigurazione"
                  size="large"
                  color="inherit"
                >
                  Ho già un account
                </Button>
              </>
            )}
          </Stack>
        </Box>

        <Stack component="ol" spacing={1.5} sx={{ listStyle: 'none', m: 0, p: 0 }}>
          {STEPS.map((step, index) => (
            <Paper
              component="li"
              key={step.title}
              variant="outlined"
              sx={{
                display: 'flex',
                gap: 2,
                alignItems: 'flex-start',
                p: 2,
                borderRadius: 2,
                bgcolor: 'background.paper'
              }}
            >
              <Box
                aria-hidden
                sx={(theme) => ({
                  flexShrink: 0,
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  display: 'grid',
                  placeItems: 'center',
                  color: 'primary.main',
                  bgcolor: alpha(theme.palette.primary.main, 0.12)
                })}
              >
                <Icon name={step.icon} size={20} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 600 }}>
                  <Box component="span" sx={{ color: 'text.secondary', mr: 1 }}>
                    {index + 1}.
                  </Box>
                  {step.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {step.text}
                </Typography>
              </Box>
            </Paper>
          ))}
        </Stack>
      </Box>
    </Paper>
  )
}
