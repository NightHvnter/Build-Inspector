import {
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'
import type { JSX } from 'react'
import { STEAM_GAMES } from '../../games'
import { estimateFps, getStatus } from '../../data/hardware'

export function BenchmarkTable({
  cpuScore,
  gpuScore,
  ram
}: {
  cpuScore: number
  gpuScore: number
  ram: number
}): JSX.Element {
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table aria-label="Prestazioni simulate della configurazione" sx={{ minWidth: 620 }}>
        <TableHead>
          <TableRow>
            {['Gioco', 'RAM di riferimento', 'FPS simulati', 'Esito del modello'].map((label) => (
              <TableCell key={label}>{label}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {STEAM_GAMES.map((game) => {
            const fps = estimateFps(game, cpuScore, gpuScore, ram)
            const status = getStatus(fps)
            return (
              <TableRow key={game.id}>
                <TableCell component="th" scope="row">
                  {game.title}
                </TableCell>
                <TableCell>
                  {game.reqRam} GB
                  {ram < game.reqRam && (
                    <Typography variant="caption" color="warning.main" sx={{ display: 'block' }}>
                      RAM selezionata inferiore
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography component="span" sx={{ fontWeight: 600 }}>
                    {fps}
                  </Typography>{' '}
                  FPS
                </TableCell>
                <TableCell>
                  <Chip label={status.label} color={status.color} size="small" variant="outlined" />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
