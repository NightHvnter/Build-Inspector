import {
  Alert,
  Box,
  Button,
  Divider,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import type { JSX } from 'react'
import { CPUS, GPUS, RAM_OPTIONS } from '../../data/hardware'
import type { Build } from '../../hooks/useBuild'
import type { Result } from '../../services/result'

interface BuildFormProps {
  build: Build
  dirty: boolean
  feedback: Result<Build> | null
  onChange: (value: Partial<Build>) => void
  onSave: () => void
}

export function BuildForm({
  build,
  dirty,
  feedback,
  onChange,
  onSave
}: BuildFormProps): JSX.Element {
  return (
    <Paper component="section" variant="outlined" sx={{ p: 3 }} aria-labelledby="build-title">
      <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', mb: 3 }}>
        <Typography id="build-title" component="h2" variant="h6">
          La tua configurazione
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {dirty ? 'Modifiche da salvare' : 'Nessuna modifica in sospeso'}
        </Typography>
      </Stack>
      <Box
        sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr 0.65fr' }, gap: 2 }}
      >
        <TextField
          select
          label="CPU"
          value={build.cpuName}
          onChange={(event) => onChange({ cpuName: event.target.value })}
        >
          {CPUS.map((cpu) => (
            <MenuItem key={cpu.name} value={cpu.name}>
              {cpu.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="GPU"
          value={build.gpuName}
          onChange={(event) => onChange({ gpuName: event.target.value })}
        >
          {GPUS.map((gpu) => (
            <MenuItem key={gpu.name} value={gpu.name}>
              {gpu.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="RAM"
          value={build.ram}
          onChange={(event) => onChange({ ram: Number(event.target.value) })}
        >
          {RAM_OPTIONS.map((ram) => (
            <MenuItem key={ram} value={ram}>
              {ram} GB
            </MenuItem>
          ))}
        </TextField>
      </Box>
      <Divider sx={{ my: 3 }} />
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' } }}
      >
        <Typography variant="body2" color="text.secondary">
          Salva prima di cambiare pagina. La configurazione viene conservata su questo dispositivo.
        </Typography>
        <Button variant="contained" onClick={onSave} sx={{ flexShrink: 0 }}>
          Salva configurazione
        </Button>
      </Stack>
      {feedback && (
        <Alert severity={feedback.ok ? 'success' : 'error'} sx={{ mt: 2 }}>
          {feedback.ok ? 'Configurazione salvata sul dispositivo.' : feedback.message}
        </Alert>
      )}
    </Paper>
  )
}
