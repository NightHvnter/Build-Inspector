import type { HardwarePart } from '@shared/types/hardware'
import type { ScannedPc } from '@shared/types/scan'

export const RAM_OPTIONS = [8, 16, 32, 64]

// The RAM sizes to offer: the usual ones plus any other value in use (e.g. a scanned 24 GB).
export function ramOptions(...inUse: number[]): number[] {
  const extra = inUse.filter((gb) => Number.isSafeInteger(gb) && gb > 0 && gb <= 4096)
  return [...new Set([...RAM_OPTIONS, ...extra])].sort((a, b) => a - b)
}

// The CPU/GPU balance check (getBottleneck) uses 0-100 scores, where the i9-14900K and the
// RTX 4090 score 100.
// The API gives PassMark marks instead, so they are scaled against those two parts.
// CPU marks count every core while games use only a few, so CPU scores grow with the
// square root of the mark, and GPU scores with mark^0.8: that keeps mid-range parts near
// the catalog's old hand-picked values (Ryzen 5 5600 ≈ 61, RTX 3060 ≈ 52).
const CPU_REFERENCE = { name: 'Intel Core i9-14900K', mark: 58149 }
const GPU_REFERENCE = { name: 'GeForce RTX 4090', mark: 38016 }
const MAX_SCORE = 150

function referenceMark(parts: HardwarePart[], fallback: { name: string; mark: number }): number {
  return parts.find((part) => part.name === fallback.name)?.mark ?? fallback.mark
}

function clampScore(score: number): number {
  return Math.max(1, Math.min(MAX_SCORE, Math.round(score)))
}

export function cpuScore(mark: number, cpus: HardwarePart[] = []): number {
  return clampScore(100 * Math.sqrt(mark / referenceMark(cpus, CPU_REFERENCE)))
}

export function gpuScore(mark: number, gpus: HardwarePart[] = []): number {
  return clampScore(100 * (mark / referenceMark(gpus, GPU_REFERENCE)) ** 0.8)
}

// "Intel(R) Core(TM) i5-8400 CPU @ 2.80GHz" → ["intel", "core", "i5-8400", "cpu"]
function nameTokens(name: string): string[] {
  return (
    name
      .toLowerCase()
      .replace(/\((r|tm|c)\)|[®™©]/g, ' ')
      .replace(/@\s*[\d.]+\s*[gm]hz/g, ' ')
      // "Core i5 750" and "Core i5-750" are the same CPU.
      .replace(/\b(i[3579])[\s-]+(\d{3,5}[a-z]*)\b/g, '$1-$2')
      .split(/[\s,/]+/)
      .filter(Boolean)
  )
}

// The API part whose name the scanned name contains, word for word ("NVIDIA GeForce
// RTX 3060" → "GeForce RTX 3060", but not "GeForce RTX 3060 Ti"). The longest such name
// wins, so "RTX 3060 Laptop GPU" beats "RTX 3060". Only names with a model number count.
export function matchPart(scannedName: string, parts: HardwarePart[]): HardwarePart | null {
  const scanned = new Set(nameTokens(scannedName))
  let best: { part: HardwarePart; size: number } | null = null
  for (const part of parts) {
    const tokens = nameTokens(part.name)
    if (tokens.length < 2 || !tokens.some((token) => /\d/.test(token))) continue
    if (!tokens.every((token) => scanned.has(token))) continue
    if (
      !best ||
      tokens.length > best.size ||
      (tokens.length === best.size && part.mark > best.part.mark)
    )
      best = { part, size: tokens.length }
  }
  return best?.part ?? null
}

export interface DetectedBuild {
  cpuName: string // empty when the scanned CPU is not in the list
  gpuName: string
  ram: number
  scannedCpu: string
  scannedGpus: string[]
}

// Turns a PC scan into form values: the matching API names, and the fastest GPU
// when the PC has more than one (e.g. integrated graphics and a graphics card).
export function detectBuild(
  pc: ScannedPc,
  catalog: { cpus: HardwarePart[]; gpus: HardwarePart[] }
): DetectedBuild {
  const cpu = pc.cpu.name ? matchPart(pc.cpu.name, catalog.cpus) : null
  const gpus = pc.gpus
    .map((gpu) => matchPart(gpu.name, catalog.gpus) ?? matchPart(gpu.model, catalog.gpus))
    .filter((gpu): gpu is HardwarePart => !!gpu)
    .sort((a, b) => b.mark - a.mark)
  return {
    cpuName: cpu?.name ?? '',
    gpuName: gpus[0]?.name ?? '',
    ram: pc.ram.totalGb,
    scannedCpu: pc.cpu.name,
    scannedGpus: pc.gpus.map((gpu) => gpu.name).filter(Boolean)
  }
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
