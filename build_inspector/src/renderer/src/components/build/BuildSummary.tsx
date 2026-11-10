import { Alert, AlertTitle } from '@mui/material'
import type { JSX } from 'react'
import { getBottleneck } from '../../data/hardware'

export function BuildSummary({
  cpuScore,
  gpuScore
}: {
  cpuScore: number
  gpuScore: number
}): JSX.Element {
  const { balanced } = getBottleneck(cpuScore, gpuScore)
  return (
    <Alert severity={balanced ? 'success' : 'warning'} sx={{ my: 3 }}>
      <AlertTitle>
        {balanced ? 'Componenti bilanciati nel modello' : 'Differenza tra i componenti'}
      </AlertTitle>
      {balanced
        ? 'Nel modello dimostrativo, i punteggi di CPU e GPU sono vicini.'
        : 'Nel modello dimostrativo, il componente con il punteggio più basso limita la stima.'}
    </Alert>
  )
}
