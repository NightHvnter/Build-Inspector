import { Alert, Box, Typography } from '@mui/material'
import type { JSX } from 'react'
import { CPUS, GPUS } from './data/hardware'
import { useBuild } from './hooks/useBuild'
import { BuildForm } from './components/build/BuildForm'
import { BuildSummary } from './components/build/BuildSummary'
import { BenchmarkTable } from './components/build/BenchmarkTable'

export function PostRegistrazione({ userId }: { userId: string }): JSX.Element {
  const { build, dirty, feedback, updateBuild, saveBuild } = useBuild(userId)
  const cpu = CPUS.find((entry) => entry.name === build.cpuName) ?? CPUS[0]
  const gpu = GPUS.find((entry) => entry.name === build.gpuName) ?? GPUS[0]
  return (
    <Box>
      <Typography component="h1" variant="h4" gutterBottom>
        La mia configurazione
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Scegli i componenti del tuo PC e prova il simulatore di prestazioni.
      </Typography>
      <BuildForm
        build={build}
        dirty={dirty}
        feedback={feedback}
        onChange={updateBuild}
        onSave={saveBuild}
      />
      <BuildSummary cpuScore={cpu.score} gpuScore={gpu.score} />
      <Typography component="h2" variant="h5" sx={{ mb: 2 }}>
        Prestazioni simulate
      </Typography>
      <Alert severity="info" sx={{ mb: 2 }}>
        Questi valori provengono da un modello semplificato, non da test reali. Non includono
        risoluzione, dettagli grafici o driver e non garantiscono gli FPS effettivi.
      </Alert>
      <BenchmarkTable cpuScore={cpu.score} gpuScore={gpu.score} ram={build.ram} />
    </Box>
  )
}
