import {
  Alert,
  Autocomplete,
  Box,
  Button,
  createFilterOptions,
  Divider,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import type { JSX } from 'react'
import type { Build } from '../../hooks/useBuild'
import type { ManualFields } from '../../data/myBuild'
import type { Result } from '../../services/result'
import { Icon } from '../Icon'

// The lists hold thousands of parts: show the first 50 matches of what the user types.
const filterParts = createFilterOptions<string>({ limit: 50 })

interface BuildFormProps {
  build: Build
  manual: ManualFields
  cpus: string[]
  gpus: string[]
  ramOptions: number[]
  loading: boolean
  dirty: boolean
  feedback: Result<Build> | null
  scanning: boolean
  canDetect: boolean
  onChange: (value: Partial<Build>) => void
  onDetect: () => void
  onSave: () => void
}

// Under each part: whether a scan can still change it.
const origin = (manual: boolean): string =>
  manual ? 'Scelto a mano: le scansioni non lo cambiano' : 'Rilevato da questo PC'

function PartField({
  label,
  value,
  options,
  loading,
  helperText,
  onChange
}: {
  label: string
  value: string
  options: string[]
  loading: boolean
  helperText: string
  onChange: (value: string) => void
}): JSX.Element {
  return (
    <Autocomplete
      options={options}
      value={value && options.includes(value) ? value : null}
      onChange={(_event, next) => onChange(next ?? '')}
      filterOptions={filterParts}
      loading={loading}
      disabled={!options.length}
      noOptionsText="Nessun componente trovato"
      loadingText="Carico l’elenco…"
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={loading ? 'Carico l’elenco…' : 'Cerca per nome'}
          helperText={helperText}
        />
      )}
    />
  )
}

export function BuildForm({
  build,
  manual,
  cpus,
  gpus,
  ramOptions,
  loading,
  dirty,
  feedback,
  scanning,
  canDetect,
  onChange,
  onDetect,
  onSave
}: BuildFormProps): JSX.Element {
  return (
    <Paper component="section" variant="outlined" sx={{ p: 3 }} aria-labelledby="build-title">
      <Stack
        direction="row"
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}
      >
        <Typography id="build-title" component="h2" variant="h6">
          La tua configurazione
        </Typography>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            {dirty ? 'Modifiche da salvare' : 'Nessuna modifica in sospeso'}
          </Typography>
          <Button
            size="small"
            onClick={onDetect}
            disabled={!canDetect}
            startIcon={<Icon name="chip" size={16} />}
          >
            {scanning ? 'Scansione…' : 'Rileva dal mio PC'}
          </Button>
        </Stack>
      </Stack>
      <Box
        sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr 0.65fr' }, gap: 2 }}
      >
        <PartField
          label="CPU"
          value={build.cpuName}
          options={cpus}
          loading={loading}
          helperText={origin(manual.cpuName)}
          onChange={(cpuName) => onChange({ cpuName })}
        />
        <PartField
          label="GPU"
          value={build.gpuName}
          options={gpus}
          loading={loading}
          helperText={origin(manual.gpuName)}
          onChange={(gpuName) => onChange({ gpuName })}
        />
        <TextField
          select
          label="RAM"
          value={build.ram}
          helperText={origin(manual.ram)}
          onChange={(event) => onChange({ ram: Number(event.target.value) })}
        >
          {ramOptions.map((ram) => (
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
          I confronti con i giochi usano questa configurazione. I componenti scelti a mano restano
          fissi; gli altri seguono la scansione del PC. Salva prima di cambiare pagina.
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
