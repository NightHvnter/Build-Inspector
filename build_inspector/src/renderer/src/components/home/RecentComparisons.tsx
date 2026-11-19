import type { JSX } from 'react'
import { Box, Button, Card, CardActionArea, Chip, Stack, Typography } from '@mui/material'
import { Link } from 'react-router-dom'
import { useHistory } from '../../hooks/useHistory'
import { steamCover } from '../../hooks/useSteamSearch'
import { Icon } from '../Icon'

// The signed-in user's latest comparisons, to pick up where they left off.
// Nothing is shown until there is at least one.
export function RecentComparisons(): JSX.Element | null {
  const { entries } = useHistory()
  const recent = entries.slice(0, 3)
  if (!recent.length) return null
  return (
    <Box component="section" aria-labelledby="recent-title" sx={{ mb: 4 }}>
      <Stack
        direction="row"
        sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}
      >
        <Typography id="recent-title" component="h2" variant="h6">
          Riprendi da dove eri rimasto
        </Typography>
        <Button
          component={Link}
          to="/cronologia"
          size="small"
          endIcon={<Icon name="arrow" size={16} />}
        >
          Cronologia
        </Button>
      </Stack>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }
        }}
      >
        {recent.map((entry) => {
          const verdict = entry.failed
            ? { color: 'error' as const, label: 'Non compatibile' }
            : entry.toCheck
              ? { color: 'warning' as const, label: 'Da verificare' }
              : { color: 'success' as const, label: 'Compatibile' }
          return (
            <Card key={entry.id} variant="outlined" sx={{ borderRadius: 2 }}>
              <CardActionArea
                component={Link}
                to={'/confronto/' + entry.appId}
                sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.25 }}
              >
                <Box
                  component="img"
                  src={steamCover(entry.appId)}
                  alt=""
                  sx={{ width: 92, aspectRatio: '460 / 215', borderRadius: 1, objectFit: 'cover' }}
                />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                    {entry.gameName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {new Date(entry.date).toLocaleDateString('it-IT', {
                      day: 'numeric',
                      month: 'short'
                    })}
                  </Typography>
                  <Chip
                    size="small"
                    variant="outlined"
                    color={verdict.color}
                    label={verdict.label}
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              </CardActionArea>
            </Card>
          )
        })}
      </Box>
    </Box>
  )
}
