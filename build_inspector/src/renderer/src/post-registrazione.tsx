import React, { useState } from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Chip,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import { Game } from './pre-registrazione';

interface PostRegistrazioneProps {
  games: Game[];
}

interface Component {
  name: string;
  score: number;
}

const CPUS: Component[] = [
  { name: 'Intel Core i3-12100F', score: 45 },
  { name: 'AMD Ryzen 5 3600', score: 48 },
  { name: 'Intel Core i5-12400F', score: 58 },
  { name: 'AMD Ryzen 5 5600', score: 60 },
  { name: 'Intel Core i5-13600K', score: 78 },
  { name: 'AMD Ryzen 7 5800X3D', score: 82 },
  { name: 'AMD Ryzen 7 7800X3D', score: 95 },
  { name: 'Intel Core i9-14900K', score: 100 }
];

const GPUS: Component[] = [
  { name: 'NVIDIA GTX 1060', score: 28 },
  { name: 'NVIDIA GTX 1660 Super', score: 38 },
  { name: 'NVIDIA RTX 2060', score: 45 },
  { name: 'NVIDIA RTX 3060', score: 55 },
  { name: 'NVIDIA RTX 3070', score: 68 },
  { name: 'AMD RX 6800 XT', score: 78 },
  { name: 'NVIDIA RTX 4070', score: 82 },
  { name: 'NVIDIA RTX 4080', score: 92 },
  { name: 'NVIDIA RTX 4090', score: 100 }
];

const RAM_OPTIONS = [8, 16, 32, 64];

// Punteggio di riferimento: con un componente da 60 si ottiene il baseFps del gioco
const REFERENCE_SCORE = 60;
const RAM_PENALTY = 0.6;

function estimateFps(game: Game, cpuScore: number, gpuScore: number, ram: number): number {
  const effective = Math.min(cpuScore, gpuScore);
  let fps = (game.baseFps * effective) / REFERENCE_SCORE;
  if (ram < game.reqRam) {
    fps *= RAM_PENALTY;
  }
  return Math.round(fps);
}

function getStatus(fps: number): { label: string; color: 'success' | 'warning' | 'error' } {
  if (fps >= 60) return { label: 'Fluido', color: 'success' };
  if (fps >= 30) return { label: 'Giocabile', color: 'warning' };
  return { label: 'Insufficiente', color: 'error' };
}

function getBottleneck(cpuScore: number, gpuScore: number): { text: string; balanced: boolean } {
  if (cpuScore < gpuScore * 0.75) {
    return { text: 'La CPU è troppo debole per la GPU scelta: limita le prestazioni.', balanced: false };
  }
  if (gpuScore < cpuScore * 0.75) {
    return { text: 'La GPU è troppo debole per la CPU scelta: limita le prestazioni.', balanced: false };
  }
  return { text: 'CPU e GPU sono ben bilanciate: nessun collo di bottiglia evidente.', balanced: true };
}

export const PostRegistrazione: React.FC<PostRegistrazioneProps> = ({ games }) => {
  const [cpuName, setCpuName] = useState<string>(CPUS[1].name);
  const [gpuName, setGpuName] = useState<string>(GPUS[1].name);
  const [ram, setRam] = useState<number>(16);

  const cpu = CPUS.find((c) => c.name === cpuName) ?? CPUS[0];
  const gpu = GPUS.find((g) => g.name === gpuName) ?? GPUS[0];
  const bottleneck = getBottleneck(cpu.score, gpu.score);

  return (
    <>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        Pannello dell'Ispettore
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4, maxWidth: 640 }}>
        Scegli i componenti del tuo PC per scoprire gli FPS stimati nei giochi della libreria.
      </Typography>

      <Typography variant="h6" sx={{ mb: 2 }}>
        La tua configurazione
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 2.5,
          mb: 3
        }}
      >
        <TextField select label="CPU" value={cpuName} onChange={(e) => setCpuName(e.target.value)}>
          {CPUS.map((c) => (
            <MenuItem key={c.name} value={c.name}>
              {c.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField select label="GPU" value={gpuName} onChange={(e) => setGpuName(e.target.value)}>
          {GPUS.map((g) => (
            <MenuItem key={g.name} value={g.name}>
              {g.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField select label="RAM" value={ram} onChange={(e) => setRam(Number(e.target.value))}>
          {RAM_OPTIONS.map((r) => (
            <MenuItem key={r} value={r}>
              {r} GB
            </MenuItem>
          ))}
        </TextField>
      </Box>

      <Alert severity={bottleneck.balanced ? 'success' : 'warning'} sx={{ mb: 4 }}>
        <AlertTitle>Collo di bottiglia</AlertTitle>
        {bottleneck.text}
      </Alert>

      <Typography variant="h6" sx={{ mb: 2 }}>
        FPS stimati
      </Typography>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Gioco</TableCell>
              <TableCell>RAM richiesta</TableCell>
              <TableCell>FPS stimati</TableCell>
              <TableCell>Esito</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {games.map((game) => {
              const fps = estimateFps(game, cpu.score, gpu.score, ram);
              const status = getStatus(fps);
              return (
                <TableRow key={game.id}>
                  <TableCell>{game.title}</TableCell>
                  <TableCell>{game.reqRam} GB</TableCell>
                  <TableCell>{fps}</TableCell>
                  <TableCell>
                    <Chip label={status.label} color={status.color} size="small" />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};