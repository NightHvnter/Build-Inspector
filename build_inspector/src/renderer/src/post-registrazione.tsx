import { Alert, Box, Button, LinearProgress, Stack, Typography } from '@mui/material'
import { useMemo, type JSX } from 'react'
import { cpuScore, detectBuild, gpuScore, ramOptions } from './data/hardware'
import { useBuild, type Build } from './hooks/useBuild'
import { useHardwareCatalog } from './hooks/useHardwareCatalog'
import { usePcScan } from './hooks/usePcScan'
import { BuildForm } from './components/build/BuildForm'
import { BuildSummary } from './components/build/BuildSummary'

export function PostRegistrazione({ userId }: { userId: string }): JSX.Element {
  const hardware = useHardwareCatalog()
  const scan = usePcScan(true)
  const catalog = hardware.catalog

  const marks = useMemo(
    () =>
      catalog && {
        cpu: new Map(catalog.cpus.map((part) => [part.name, part.mark])),
        gpu: new Map(catalog.gpus.map((part) => [part.name, part.mark]))
      },
    [catalog]
  )
  const detected = useMemo(
    () => (catalog && scan.pc ? detectBuild(scan.pc, catalog) : null),
    [catalog, scan.pc]
  )
  const detectedBuild: Build | null = detected && {
    cpuName: detected.cpuName,
    gpuName: detected.gpuName,
    ram: detected.ram || 16
  }

  const { build, manual, saved, dirty, feedback, updateBuild, applyDetected, saveBuild } = useBuild(
    userId,
    {
      isKnown: marks
        ? (field, value) =>
            field === 'cpuName'
              ? marks.cpu.has(String(value))
              : field === 'gpuName'
                ? marks.gpu.has(String(value))
                : true
        : null,
      detected: detectedBuild
    }
  )

  const cpuMark = marks?.cpu.get(build.cpuName)
  const gpuMark = marks?.gpu.get(build.gpuName)
  const scores =
    catalog && cpuMark && gpuMark
      ? { cpu: cpuScore(cpuMark, catalog.cpus), gpu: gpuScore(gpuMark, catalog.gpus) }
      : null

  return (
    <Box>
      <Typography component="h1" variant="h4" gutterBottom>
        La mia configurazione
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {saved
          ? 'La configurazione usata nei confronti. Usa “Rileva dal mio PC” per tornare ai componenti di questo computer.'
          : 'I componenti sono rilevati da questo PC: controllali, correggili se serve e salva. Quelli che scegli a mano non vengono più cambiati dalle scansioni.'}
      </Typography>
      {(hardware.loading || scan.scanning) && (
        <Stack spacing={0.5} sx={{ mb: 2 }} role="status">
          <LinearProgress aria-label="Caricamento" />
          <Typography variant="caption" color="text.secondary">
            {[
              hardware.loading && 'Carico l’elenco dei componenti…',
              scan.scanning && 'Scansiono il tuo PC…'
            ]
              .filter(Boolean)
              .join(' ')}
          </Typography>
        </Stack>
      )}
      {hardware.error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            window.api?.hardware && (
              <Button color="inherit" size="small" onClick={hardware.retry}>
                Riprova
              </Button>
            )
          }
        >
          {hardware.error}
        </Alert>
      )}
      {scan.error && window.api?.scanner && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {scan.error}
        </Alert>
      )}
      {detected && (!detected.cpuName || !detected.gpuName) && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {!detected.cpuName &&
            `CPU rilevata non trovata nell’elenco${detected.scannedCpu ? ` (${detected.scannedCpu})` : ''}. `}
          {!detected.gpuName &&
            `GPU rilevata non trovata nell’elenco${detected.scannedGpus.length ? ` (${detected.scannedGpus.join(', ')})` : ''}. `}
          Sceglila a mano.
        </Alert>
      )}
      <BuildForm
        build={build}
        manual={manual}
        cpus={catalog?.cpus.map((part) => part.name) ?? []}
        gpus={catalog?.gpus.map((part) => part.name) ?? []}
        ramOptions={ramOptions(build.ram, detected?.ram ?? 0)}
        loading={hardware.loading}
        dirty={dirty}
        feedback={feedback}
        scanning={scan.scanning}
        canDetect={!!detected}
        onChange={updateBuild}
        onDetect={applyDetected}
        onSave={saveBuild}
      />
      {scores && <BuildSummary cpuScore={scores.cpu} gpuScore={scores.gpu} />}
    </Box>
  )
}
