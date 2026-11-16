import type { HardwareCatalog, HardwarePart } from '@shared/types/hardware'
import type { ScannedPc } from '@shared/types/scan'
import type { GameRequirements, RequirementKind } from '@shared/types/steam'
import { sizeInGb } from '@shared/units'
import type { HistoryRecord } from '../../../shared/history'
import { detectBuild, matchRequirement } from './hardware'

// ok: the PC meets it; low: it doesn't; check: it can't be decided from the data;
// info: nothing on the PC to compare (DirectX, notes).
export type Verdict = 'ok' | 'low' | 'check' | 'info'

export interface ComparisonRow {
  kind: RequirementKind
  label: string
  required: string
  yours: string
  verdict: Verdict
  detail: string
}

const LABELS: Record<RequirementKind, string> = {
  os: 'Sistema operativo',
  cpu: 'Processore',
  ram: 'Memoria',
  gpu: 'Scheda video',
  storage: 'Archiviazione',
  directx: 'DirectX',
  other: 'Note'
}

const marks = (n: number): string => n.toLocaleString('it-IT')

// The game's weakest listed part is enough: "i7-6700 or Ryzen 5 1600" needs the lower of the two.
function comparePart(
  text: string,
  yours: HardwarePart | null,
  scannedName: string,
  parts: HardwarePart[]
): Pick<ComparisonRow, 'yours' | 'verdict' | 'detail'> {
  const shown = yours?.name ?? (scannedName || '—')
  const listed = matchRequirement(text, parts)
  if (!listed.length)
    return {
      yours: shown,
      verdict: 'check',
      detail: 'Steam non indica un modello preciso: confronta a mano.'
    }
  if (!yours)
    return {
      yours: shown,
      verdict: 'check',
      detail: 'Il componente del tuo PC non è nell’elenco: confronta a mano.'
    }
  const needed = listed.reduce((low, part) => (part.mark < low.mark ? part : low))
  const enough = yours.mark >= needed.mark
  return {
    yours: shown,
    verdict: enough ? 'ok' : 'low',
    detail: `PassMark: ${marks(yours.mark)} contro ${marks(needed.mark)} (${needed.name}).`
  }
}

function compareSize(
  neededGb: number | null,
  yoursGb: number | undefined,
  what: string
): Pick<ComparisonRow, 'verdict' | 'detail'> {
  if (!neededGb || !yoursGb)
    return { verdict: 'check', detail: `Steam o la scansione non indicano ${what}.` }
  return yoursGb >= neededGb
    ? { verdict: 'ok', detail: `${yoursGb} GB contro ${neededGb} GB richiesti.` }
    : { verdict: 'low', detail: `Mancano ${Math.ceil(neededGb - yoursGb)} GB.` }
}

// Lines up a game's minimum requirements with this PC's scan, one row per requirement.
export function compareWithPc(
  requirements: GameRequirements,
  pc: ScannedPc,
  catalog: HardwareCatalog | null
): ComparisonRow[] {
  const detected = catalog ? detectBuild(pc, catalog) : null
  const yourCpu = (catalog && catalog.cpus.find((p) => p.name === detected?.cpuName)) || null
  const yourGpu = (catalog && catalog.gpus.find((p) => p.name === detected?.gpuName)) || null
  const vramGb = Math.max(0, ...pc.gpus.map((gpu) => gpu.vramMb)) / 1024

  return requirements.minimum.map((row) => {
    const base = { kind: row.kind, label: row.label || LABELS[row.kind], required: row.value }
    switch (row.kind) {
      case 'cpu':
        return {
          ...base,
          ...comparePart(row.value, yourCpu, pc.cpu.name, catalog?.cpus ?? [])
        }
      case 'gpu': {
        const result = comparePart(row.value, yourGpu, pc.gpus[0]?.name ?? '', catalog?.gpus ?? [])
        // "At least 1 GB of video memory" names no model, but the memory can be compared.
        const neededVram = sizeInGb(row.value)
        if (result.verdict === 'check' && neededVram && vramGb > 0)
          return {
            ...base,
            yours: result.yours,
            ...compareSize(neededVram, Math.round(vramGb), 'la memoria video')
          }
        return { ...base, ...result }
      }
      case 'ram':
        return {
          ...base,
          yours: pc.ram.totalGb ? pc.ram.totalGb + ' GB' : '—',
          ...compareSize(requirements.ramGb, pc.ram.totalGb, 'la RAM')
        }
      case 'storage':
        return {
          ...base,
          yours: pc.freeStorageGb ? pc.freeStorageGb + ' GB liberi' : '—',
          ...compareSize(requirements.storageGb, pc.freeStorageGb, 'lo spazio libero')
        }
      case 'os':
        return {
          ...base,
          yours: [pc.os.distro, pc.os.release].filter(Boolean).join(' ') || '—',
          verdict: 'check',
          detail: 'Controlla versione e architettura (64 bit).'
        }
      default:
        return { ...base, yours: '', verdict: 'info', detail: '' }
    }
  })
}

// Totals for the summary at the top of the page.
export function summarize(rows: ComparisonRow[]): Record<Verdict, number> {
  const totals: Record<Verdict, number> = { ok: 0, low: 0, check: 0, info: 0 }
  for (const row of rows) totals[row.verdict]++
  return totals
}

// What a finished comparison saves to the history (window.api.history.record).
export function historyRecord(
  requirements: GameRequirements,
  pc: ScannedPc,
  catalog: HardwareCatalog | null,
  rows: ComparisonRow[]
): HistoryRecord {
  const detected = catalog ? detectBuild(pc, catalog) : null
  const totals = summarize(rows)
  return {
    appId: requirements.appId,
    gameName: (requirements.name || 'Gioco ' + requirements.appId).slice(0, 255),
    cpuName: detected?.cpuName || null,
    gpuName: detected?.gpuName || null,
    ramGb: pc.ram.totalGb || null,
    met: totals.ok,
    failed: totals.low,
    toCheck: totals.check
  }
}
