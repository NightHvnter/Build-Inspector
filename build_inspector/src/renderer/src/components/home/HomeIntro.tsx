import type { JSX } from 'react'
import { Box, Button, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Link } from 'react-router-dom'
import type { User } from '../../../../shared/auth'
import { Icon } from '../Icon'

const STEPS = ['Scegli un gioco', 'Scansiona il tuo PC', 'Leggi il report'] as const

// The home's opening strip: what the app does in one line, and the next step for this user.
export function HomeIntro({ user }: { user: User | null }): JSX.Element {
  return (
    <Paper
      component="section"
      variant="outlined"
      aria-labelledby="home-title"
      sx={(theme) => ({
        mb: 4,
        p: { xs: 2.5, md: 3 },
        borderRadius: 3,
        background: `linear-gradient(120deg, ${alpha(theme.palette.primary.main, 0.14)} 0%, ${theme.palette.background.paper} 70%)`
      })}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2.5}
        sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between' }}
      >
        <Box sx={{ minWidth: 0 }}>
          {user && (
            <Typography variant="body2" color="primary" sx={{ fontWeight: 600, mb: 0.5 }}>
              Ciao, {user.name}
            </Typography>
          )}
          <Typography
            id="home-title"
            component="h1"
            sx={{ fontSize: { xs: 24, md: 28 }, fontWeight: 700, lineHeight: 1.2, mb: 1 }}
          >
            Scopri se il tuo PC è pronto per i tuoi giochi.
          </Typography>
          <Stack
            component="ol"
            direction="row"
            spacing={1}
            useFlexGap
            sx={{ flexWrap: 'wrap', listStyle: 'none', m: 0, p: 0, alignItems: 'center' }}
            aria-label="Come funziona"
          >
            {STEPS.map((step, index) => (
              <Stack
                component="li"
                key={step}
                direction="row"
                spacing={0.75}
                sx={{ alignItems: 'center', color: 'text.secondary' }}
              >
                <Box
                  aria-hidden
                  sx={(theme) => ({
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'primary.main',
                    bgcolor: alpha(theme.palette.primary.main, 0.14)
                  })}
                >
                  {index + 1}
                </Box>
                <Typography variant="body2">{step}</Typography>
                {index < STEPS.length - 1 && (
                  <Box aria-hidden sx={{ display: 'flex', opacity: 0.5, pl: 0.25 }}>
                    <Icon name="arrow" size={14} />
                  </Box>
                )}
              </Stack>
            ))}
          </Stack>
        </Box>
        <Stack direction="row" spacing={1.5} useFlexGap sx={{ flexWrap: 'wrap', flexShrink: 0 }}>
          {user ? (
            <Button
              component={Link}
              to="/configurazione"
              variant="contained"
              startIcon={<Icon name="chip" size={18} />}
            >
              La mia build
            </Button>
          ) : (
            <>
              <Button
                component={Link}
                to="/registrazione?next=%2Fconfigurazione"
                variant="contained"
                endIcon={<Icon name="arrow" size={18} />}
              >
                Crea un account gratuito
              </Button>
              <Button component={Link} to="/login?next=%2Fconfigurazione" color="inherit">
                Accedi
              </Button>
            </>
          )}
        </Stack>
      </Stack>
    </Paper>
  )
}
