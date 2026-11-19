import type { JSX } from 'react'
import { Box, Chip, Paper, Stack, Typography, alpha } from '@mui/material'
import type { Upgrade, PartSuggestion } from '../../data/upgrades'
import { Icon } from '../Icon'

const PRIORITY = {
  required: { label: 'Necessario', color: 'error' },
  recommended: { label: 'Consigliato', color: 'warning' }
} as const

// "Come migliorare il tuo PC": what to change, and with which parts, for every component
// that isn't green in the comparison.
export function UpgradeAdvice({ upgrades }: { upgrades: Upgrade[] }): JSX.Element | null {
  if (!upgrades.length) return null
  const required = upgrades.filter((u) => u.priority === 'required').length
  return (
    <Box component="section" aria-labelledby="upgrades-title" sx={{ mt: 4 }}>
      <Typography id="upgrades-title" component="h2" variant="h6">
        Come migliorare il tuo PC
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {required
          ? 'Per far girare il gioco va cambiato quello segnato come necessario; il resto è facoltativo.'
          : 'Il PC raggiunge i requisiti minimi: questi aggiornamenti danno più margine.'}{' '}
        I modelli proposti sono i meno potenti che superano bene il minimo, quindi di solito i più
        economici.
      </Typography>
      <Stack spacing={2}>
        {upgrades.map((upgrade) => (
          <UpgradeCard key={upgrade.kind + upgrade.label} upgrade={upgrade} />
        ))}
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
        I consigli si basano sui punteggi PassMark e sul modello rilevato: prezzi e disponibilità
        non sono considerati.
      </Typography>
    </Box>
  )
}

function UpgradeCard({ upgrade }: { upgrade: Upgrade }): JSX.Element {
  const priority = PRIORITY[upgrade.priority]
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        borderRadius: 2,
        borderLeft: 4,
        borderLeftColor: `${priority.color}.main`
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5, flexWrap: 'wrap' }}>
        <Typography component="h3" sx={{ fontWeight: 700 }}>
          {upgrade.label}
        </Typography>
        <Chip size="small" color={priority.color} variant="outlined" label={priority.label} />
      </Stack>
      <Typography variant="body2" sx={{ mb: upgrade.parts.length ? 1.5 : 1 }}>
        {upgrade.summary}
      </Typography>

      {upgrade.parts.length > 0 && (
        <Box
          sx={{
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: { xs: '1fr', md: 'repeat(auto-fill, minmax(240px, 1fr))' },
            mb: 1.5
          }}
        >
          {upgrade.parts.map((part) => (
            <PartCard key={part.name} part={part} />
          ))}
        </Box>
      )}

      {upgrade.tips.length > 0 && (
        <Stack component="ul" spacing={0.5} sx={{ m: 0, pl: 2.5 }}>
          {upgrade.tips.map((tip) => (
            <Typography component="li" variant="body2" color="text.secondary" key={tip}>
              {tip}
            </Typography>
          ))}
        </Stack>
      )}
    </Paper>
  )
}

function PartCard({ part }: { part: PartSuggestion }): JSX.Element {
  return (
    <Box
      sx={(theme) => ({
        p: 1.5,
        borderRadius: 1.5,
        border: 1,
        borderColor: 'divider',
        bgcolor: alpha(theme.palette.text.primary, 0.03)
      })}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
        <Box sx={{ color: 'primary.main', display: 'flex' }}>
          <Icon name="chip" size={16} />
        </Box>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {part.name}
        </Typography>
      </Stack>
      <Stack direction="row" spacing={1} sx={{ mb: 0.5, flexWrap: 'wrap' }} useFlexGap>
        <Chip
          size="small"
          color="success"
          label={`${part.score}% del requisito`}
          aria-label={`${part.score}% del requisito minimo`}
        />
        <Chip size="small" variant="outlined" label={`+${part.gain}% rispetto al tuo`} />
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        PassMark {part.mark.toLocaleString('it-IT')} · {part.note}
      </Typography>
    </Box>
  )
}
