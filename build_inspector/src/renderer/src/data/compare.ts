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
  // How your part compares with the required one, in percent: 100 = exactly the minimum,
  // 250 = two and a half times it. Null when there is nothing to measure.
  score: number | null
}

const percent = (yours: number, needed: number): number => Math.round((yours / needed) * 100)

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
): Pick<ComparisonRow, 'yours' | 'verdict' | 'detail' | 'score'> {
  const shown = yours?.name ?? (scannedName || '—')
  const listed = matchRequirement(text, parts)
  if (!listed.length)
    return {
      yours: shown,
      verdict: 'check',
      detail: 'Steam non indica un modello preciso: confronta a mano.',
      score: null
    }
  if (!yours)
    return {
      yours: shown,
      verdict: 'check',
      detail: 'Il componente del tuo PC non è nell’elenco: confronta a mano.',
      score: null
    }
  const needed = listed.reduce((low, part) => (part.mark < low.mark ? part : low))
  const enough = yours.mark >= needed.mark
  return {
    yours: shown,
    verdict: enough ? 'ok' : 'low',
    detail: `PassMark: ${marks(yours.mark)} contro ${marks(needed.mark)} (${needed.name}).`,
    score: percent(yours.mark, needed.mark)
  }
}

function compareSize(
  neededGb: number | null,
  yoursGb: number | undefined,
  what: string
): Pick<ComparisonRow, 'verdict' | 'detail' | 'score'> {
  if (!neededGb || !yoursGb)
    return { verdict: 'check', detail: `Steam o la scansione non indicano ${what}.`, score: null }
  const score = percent(yoursGb, neededGb)
  return yoursGb >= neededGb
    ? { verdict: 'ok', detail: `${yoursGb} GB contro ${neededGb} GB richiesti.`, score }
    : { verdict: 'low', detail: `Mancano ${Math.ceil(neededGb - yoursGb)} GB.`, score }
}

type OsFamily = 'windows' | 'macos' | 'linux'

const OS_NAMES: Record<OsFamily, string> = { windows: 'Windows', macos: 'macOS', linux: 'Linux' }

// The system a text names; Steam's PC requirements are Windows ones unless they say otherwise.
function requiredFamily(text: string): OsFamily {
  if (/\b(mac\s*os|os\s*x|macos)\b/i.test(text)) return 'macos'
  if (/\b(linux|ubuntu|steam\s*os|debian|fedora)\b/i.test(text)) return 'linux'
  return 'windows'
}

function pcFamily(os: ScannedPc['os']): OsFamily | null {
  const name = `${os.platform} ${os.distro}`
  // "darwin" contains "win", so macOS is tested first.
  if (/darwin|mac/i.test(name)) return 'macos'
  if (/win/i.test(name)) return 'windows'
  if (/linux|ubuntu|steam\s*os|debian|fedora|arch/i.test(name)) return 'linux'
  return null
}

// The Windows versions a text names, as numbers (XP = 5, Vista = 6, 8.1 = 8.1).
function windowsVersions(text: string): number[] {
  const after = text.slice(Math.max(0, text.search(/windows/i)))
  const versions: number[] = []
  for (const [, v] of after.matchAll(/\b(xp|vista|7|8\.1|8|10|11)\b/gi))
    versions.push(v.toLowerCase() === 'xp' ? 5 : v.toLowerCase() === 'vista' ? 6 : Number(v))
  return versions
}

// Same system: met. Windows 10 and 11 count as the same; a game that still lists an older
// Windows has to be checked by hand, since it may not run on the current ones.
function compareOs(text: string, os: ScannedPc['os']): Pick<ComparisonRow, 'verdict' | 'detail'> {
  const needed = requiredFamily(text)
  const yours = pcFamily(os)
  if (!yours) return { verdict: 'check', detail: 'La scansione non indica il sistema operativo.' }
  if (yours !== needed)
    return {
      verdict: 'low',
      detail: `Il gioco richiede ${OS_NAMES[needed]}, il tuo PC usa ${OS_NAMES[yours]}.`
    }
  if (needed !== 'windows') return { verdict: 'ok', detail: `Entrambi ${OS_NAMES[needed]}.` }

  const minimum = Math.min(...windowsVersions(text))
  if (minimum < 10)
    return {
      verdict: 'check',
      detail: 'Il gioco indica una versione di Windows precedente alla 10: verifica che funzioni.'
    }
  const pcVersions = windowsVersions(os.distro)
  if (pcVersions.length && pcVersions[0] < 10)
    return { verdict: 'low', detail: 'Il gioco richiede Windows 10 o successivo.' }
  return { verdict: 'ok', detail: 'Windows 10 e 11 sono compatibili tra loro.' }
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
          ...compareOs(row.value, pc.os),
          score: null
        }
      default:
        return { ...base, yours: '', verdict: 'info', detail: '', score: null }
    }
  })
}

// Totals for the summary at the top of the page.
export function summarize(rows: ComparisonRow[]): Record<Verdict, number> {
  const totals: Record<Verdict, number> = { ok: 0, low: 0, check: 0, info: 0 }
  for (const row of rows) totals[row.verdict]++
  return totals
}

// The measured row with the lowest score: the part that limits the PC the most.
export function weakestRow(rows: ComparisonRow[]): ComparisonRow | null {
  let weakest: ComparisonRow | null = null
  for (const row of rows)
    if (row.score !== null && (weakest === null || row.score < (weakest.score ?? Infinity)))
      weakest = row
  return weakest
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
