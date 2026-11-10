import type { Game } from '../games'
interface Component {
  name: string
  score: number
}

export const CPUS: Component[] = [
  { name: 'Intel Core i3-12100F', score: 45 },
  { name: 'AMD Ryzen 5 3600', score: 48 },
  { name: 'Intel Core i5-12400F', score: 58 },
  { name: 'AMD Ryzen 5 5600', score: 60 },
  { name: 'Intel Core i5-13600K', score: 78 },
  { name: 'AMD Ryzen 7 5800X3D', score: 82 },
  { name: 'AMD Ryzen 7 7800X3D', score: 95 },
  { name: 'Intel Core i9-14900K', score: 100 }
]

export const GPUS: Component[] = [
  { name: 'NVIDIA GTX 1060', score: 28 },
  { name: 'NVIDIA GTX 1660 Super', score: 38 },
  { name: 'NVIDIA RTX 2060', score: 45 },
  { name: 'NVIDIA RTX 3060', score: 55 },
  { name: 'NVIDIA RTX 3070', score: 68 },
  { name: 'AMD RX 6800 XT', score: 78 },
  { name: 'NVIDIA RTX 4070', score: 82 },
  { name: 'NVIDIA RTX 4080', score: 92 },
  { name: 'NVIDIA RTX 4090', score: 100 }
]

export const RAM_OPTIONS = [8, 16, 32, 64]

// Punteggio di riferimento: con un componente da 60 si ottiene il baseFps del gioco
const REFERENCE_SCORE = 60
const RAM_PENALTY = 0.6

export function estimateFps(game: Game, cpuScore: number, gpuScore: number, ram: number): number {
  const effective = Math.min(cpuScore, gpuScore)
  let fps = (game.baseFps * effective) / REFERENCE_SCORE
  if (ram < game.reqRam) {
    fps *= RAM_PENALTY
  }
  return Math.round(fps)
}

export function getStatus(fps: number): { label: string; color: 'success' | 'warning' | 'error' } {
  if (fps >= 60) return { label: 'Fluido', color: 'success' }
  if (fps >= 30) return { label: 'Giocabile', color: 'warning' }
  return { label: 'Insufficiente', color: 'error' }
}

export function getBottleneck(
  cpuScore: number,
  gpuScore: number
): { text: string; balanced: boolean } {
  if (cpuScore < gpuScore * 0.75) {
    return {
      text: 'La CPU è troppo debole per la GPU scelta: limita le prestazioni.',
      balanced: false
    }
  }
  if (gpuScore < cpuScore * 0.75) {
    return {
      text: 'La GPU è troppo debole per la CPU scelta: limita le prestazioni.',
      balanced: false
    }
  }
  return {
    text: 'CPU e GPU sono ben bilanciate: nessun collo di bottiglia evidente.',
    balanced: true
  }
}
