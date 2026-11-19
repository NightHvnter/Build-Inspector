import type { HardwareCatalog, HardwarePart } from '@shared/types/hardware'
import type { ScannedPc } from '@shared/types/scan'
import type { GameRequirements } from '@shared/types/steam'
import type { ComparisonRow } from './compare'
import { detectBuild } from './hardware'
import type { MyBuild } from './myBuild'

// Upgrades aim for a comfortable margin over the minimum ("Buono" on the quality meter),
// and a replacement part must also be clearly faster than the one in the PC.
export const TARGET_SCORE = 130
const MIN_GAIN = 1.2
// Components between the minimum and this score get an optional suggestion.
const TIGHT_SCORE = 130

export type UpgradePriority = 'required' | 'recommended'

export interface PartSuggestion {
  name: string
  mark: number
  score: number // percent of the game's requirement, like the comparison table
  gain: number // percent faster than the part in the PC
  note: string // compatibility: same motherboard, or what else has to change
}

export interface Upgrade {
  kind: ComparisonRow['kind']
  label: string
  priority: UpgradePriority
  summary: string
  parts: PartSuggestion[]
  tips: string[]
}

// ---- Desktop processors: model → socket, so a suggestion can say if it fits the PC ----

// LGA1151 is split: Intel 8th-9th gen use the same socket as 6th-7th but need a 300-series
// motherboard, so neither fits the other's boards.
export type Socket = 'AM4' | 'AM5' | 'LGA1151' | 'LGA1151 v2' | 'LGA1200' | 'LGA1700' | 'LGA1851'

// DDR5 only on these sockets: moving to them also means new memory.
const DDR5_SOCKETS: Socket[] = ['AM5', 'LGA1851']
// Where a new desktop PC is built today: suggested when the current motherboard can't go far enough.
const CURRENT_SOCKETS: Socket[] = ['AM5', 'LGA1700', 'LGA1851']

// The socket of a desktop CPU from its name, or null for laptop, server, low-power and
// unknown models (those are never suggested).
export function cpuSocket(fullName: string): Socket | null {
  // PassMark adds the clock to older models: "Intel Core i5-6500 @ 3.20GHz".
  const name = fullName.replace(/ @ [\d.]+GHz$/, '')
  const ryzen = /^AMD Ryzen [3579] (\d)\d{3}(X3D|XT|X|G|F)?$/.exec(name)
  if (ryzen) {
    const series = Number(ryzen[1])
    if (series >= 1 && series <= 5) return 'AM4'
    if (series >= 7 && series <= 9) return 'AM5'
    return null
  }
  const core = /^Intel Core i[3579]-(\d{4,5})(K|F|KF|KS)?$/.exec(name)
  if (core) {
    const gen = core[1].length === 5 ? Number(core[1].slice(0, 2)) : Number(core[1][0])
    if (gen === 6 || gen === 7) return 'LGA1151'
    if (gen === 8 || gen === 9) return 'LGA1151 v2'
    if (gen === 10 || gen === 11) return 'LGA1200'
    if (gen >= 12 && gen <= 14) return 'LGA1700'
    return null
  }
  if (/^Intel Core Ultra [579] 2\d{2}(K|F|KF)?( Plus)?$/.test(name)) return 'LGA1851'
  return null
}

// ---- Desktop graphics cards of the last few generations, still sold new ----

const DESKTOP_GPU = [
  /^GeForce RTX (20[6-8]0|30[5-9]0|40[6-9]0|50[6-9]0)( Ti)?( SUPER)?$/,
  /^GeForce GTX 16[5-6]0( Ti| SUPER)?$/,
  /^Radeon RX (6[5-9]\d0|7[6-9]\d0|9[06]\d0)( XT| XTX| GRE)?$/,
  /^Intel Arc (A[57][5-8]0|B5[78]0)$/
]
const RECENT_GPU = /RTX [345]0|RX [79]\d{3}|Arc B/

const isDesktopGpu = (name: string): boolean => DESKTOP_GPU.some((re) => re.test(name))
const gpuBrand = (name: string): string =>
  name.startsWith('GeForce') ? 'NVIDIA' : name.startsWith('Radeon') ? 'AMD' : 'Intel'

const pct = (a: number, b: number): number => Math.round((a / b) * 100)

// The weakest parts that still reach `target`: the closest thing to "cheapest" the
// data allows, since the catalog has scores but no prices.
function cheapestAbove(parts: HardwarePart[], target: number): HardwarePart[] {
  return parts.filter((p) => p.mark >= target).sort((a, b) => a.mark - b.mark)
}

function suggestion(
  part: HardwarePart,
  needed: number,
  yours: number,
  note: string
): PartSuggestion {
  return {
    name: part.name,
    mark: part.mark,
    score: pct(part.mark, needed),
    gain: pct(part.mark, yours) - 100,
    note
  }
}

function cpuParts(
  row: ComparisonRow,
  pc: ScannedPc,
  catalog: HardwareCatalog,
  build: MyBuild | null
): PartSuggestion[] {
  const { yourMark, neededMark } = row
  if (!yourMark || !neededMark) return []
  const target = Math.max(neededMark * (TARGET_SCORE / 100), yourMark * MIN_GAIN)
  const cpuName = build?.cpuName || detectBuild(pc, catalog).cpuName
  const socket = cpuName ? cpuSocket(cpuName) : null
  const desktop = catalog.cpus.filter((p) => cpuSocket(p.name) !== null)
  const out: PartSuggestion[] = []

  // 1. A processor for the same motherboard, if one is fast enough.
  if (socket) {
    const same = cheapestAbove(
      desktop.filter((p) => cpuSocket(p.name) === socket),
      target
    )
    if (same[0])
      out.push(
        suggestion(
          same[0],
          neededMark,
          yourMark,
          `Compatibile con la tua scheda madre (${socket}).`
        )
      )
    if (out.length) return out
  }

  // 2. Otherwise a new platform: one Intel and one AMD processor of today's sockets.
  for (const brand of ['AMD', 'Intel']) {
    const [best] = cheapestAbove(
      desktop.filter((p) => {
        const s = cpuSocket(p.name)
        return !!s && CURRENT_SOCKETS.includes(s) && p.name.startsWith(brand)
      }),
      target
    )
    if (!best) continue
    const s = cpuSocket(best.name)!
    const note =
      (socket
        ? `Non entra nella tua scheda madre (${socket}): serve una scheda madre ${s}`
        : `Serve una scheda madre ${s}: controlla il socket della tua`) +
      (DDR5_SOCKETS.includes(s) ? ' e memoria DDR5.' : '.')
    out.push(suggestion(best, neededMark, yourMark, note))
  }
  return out
}

function gpuParts(row: ComparisonRow, catalog: HardwareCatalog): PartSuggestion[] {
  const { yourMark, neededMark } = row
  if (!yourMark || !neededMark) return []
  const target = Math.max(neededMark * (TARGET_SCORE / 100), yourMark * MIN_GAIN)
  const desktop = catalog.gpus.filter((p) => isDesktopGpu(p.name))
  // Newer generations first; older ones only if no recent card is enough.
  const recent = desktop.filter((p) => RECENT_GPU.test(p.name))
  const pool = cheapestAbove(recent, target).length ? recent : desktop
  const out: PartSuggestion[] = []
  const brands = new Set<string>()
  for (const part of cheapestAbove(pool, target)) {
    const brand = gpuBrand(part.name)
    if (brands.has(brand)) continue
    brands.add(brand)
    out.push(suggestion(part, neededMark, yourMark, `${brand} · scheda desktop PCIe.`))
    if (out.length === 3) break
  }
  return out
}

const RAM_SIZES = [8, 16, 32, 64, 128]

function ramTips(
  pc: ScannedPc,
  neededGb: number,
  priority: UpgradePriority,
  build: MyBuild | null
): string[] {
  const have = build?.ram || pc.ram.totalGb
  const target =
    RAM_SIZES.find(
      (size) => size >= neededGb * (priority === 'required' ? 1 : 1.3) && size > have
    ) ?? RAM_SIZES[RAM_SIZES.length - 1]
  // The scanned modules describe this PC's memory, not an amount chosen by hand.
  const module = build?.manual.ram
    ? undefined
    : (pc.ram.modules ?? []).find((m) => m.type || m.speedMhz)
  const kind = [module?.type, module?.speedMhz ? module.speedMhz + ' MHz' : '']
    .filter(Boolean)
    .join(' ')
  return [
    `Porta la memoria a ${target} GB: per esempio un kit 2 × ${target / 2} GB${kind ? ` ${kind}, come i moduli che hai già` : ''}.`,
    'Due moduli uguali funzionano in dual channel e sono più veloci di uno solo.',
    'Controlla quanti slot liberi ha la scheda madre e il massimo che supporta.'
  ]
}

const DISK_SIZES = [500, 1000, 2000, 4000]
const diskName = (gb: number): string => (gb >= 1000 ? `${gb / 1000} TB` : `${gb} GB`)

function storageTips(pc: ScannedPc, neededGb: number): string[] {
  const free = pc.freeStorageGb ?? 0
  const missing = Math.max(0, Math.ceil(neededGb - free))
  const disk = DISK_SIZES.find((size) => size >= neededGb * 2) ?? DISK_SIZES[DISK_SIZES.length - 1]
  return [
    missing
      ? `Libera almeno ${missing} GB: disinstalla giochi che non usi o svuota la cartella Download.`
      : 'Tieni libero un po’ di spazio in più per aggiornamenti e salvataggi.',
    `Oppure aggiungi un SSD da ${diskName(disk)}: i giochi si caricano molto più in fretta che da un disco tradizionale.`
  ]
}

function osTips(row: ComparisonRow, pc: ScannedPc): string[] {
  const linux = /linux/i.test(pc.os.platform)
  return [
    `Il gioco chiede: ${row.required}.`,
    ...(linux
      ? [
          'Su Linux prova Steam Play (Proton): molti giochi Windows funzionano senza installare altro.',
          'Controlla la compatibilità del gioco su protondb.com.'
        ]
      : ['Puoi installare Windows 10 o 11 accanto al sistema attuale (dual boot).'])
  ]
}

// What to upgrade so the game runs, for every component below the minimum ("required")
// or only just above it ("recommended"). Components that can't be measured get nothing.
export function suggestUpgrades(
  rows: ComparisonRow[],
  requirements: GameRequirements,
  pc: ScannedPc,
  catalog: HardwareCatalog | null,
  build: MyBuild | null = null
): Upgrade[] {
  const upgrades: Upgrade[] = []
  for (const row of rows) {
    const required = row.verdict === 'low'
    const tight = row.verdict === 'ok' && row.score !== null && row.score < TIGHT_SCORE
    if (!required && !tight) continue
    const priority: UpgradePriority = required ? 'required' : 'recommended'
    const base = { kind: row.kind, label: row.label, priority }
    const gap = row.score !== null ? `${row.score}% del minimo richiesto` : ''

    switch (row.kind) {
      case 'cpu':
      case 'gpu': {
        const parts =
          catalog && row.kind === 'cpu'
            ? cpuParts(row, pc, catalog, build)
            : catalog
              ? gpuParts(row, catalog)
              : []
        // A card checked only by its video memory: no model to compare with.
        const vramOnly = row.kind === 'gpu' && !row.neededMark
        const part =
          row.kind === 'cpu'
            ? { what: 'Il tuo processore', replaced: 'sostituito' }
            : { what: 'La tua scheda video', replaced: 'sostituita' }
        upgrades.push({
          ...base,
          summary: required
            ? `${part.what} arriva al ${gap}: va ${part.replaced}.`
            : `${part.what} raggiunge il minimo con poco margine (${gap}): nelle scene più pesanti potresti avere rallentamenti.`,
          parts,
          tips:
            row.kind === 'gpu'
              ? [
                  vramOnly
                    ? `Serve una scheda video con almeno la memoria richiesta: ${row.required}.`
                    : 'Controlla che l’alimentatore abbia la potenza e i connettori della nuova scheda, e che ci stia nel case.'
                ]
              : [
                  'Prima di comprare, verifica sul sito del produttore della scheda madre che il processore sia supportato (può servire un aggiornamento del BIOS).'
                ]
        })
        break
      }
      case 'ram':
        if (!requirements.ramGb) break
        upgrades.push({
          ...base,
          summary: required
            ? `Hai ${build?.ram || pc.ram.totalGb} GB di memoria, il gioco ne chiede ${requirements.ramGb}.`
            : `Hai giusto la memoria richiesta (${gap}): con altri programmi aperti potrebbe non bastare.`,
          parts: [],
          tips: ramTips(pc, requirements.ramGb, priority, build)
        })
        break
      case 'storage':
        if (!requirements.storageGb) break
        upgrades.push({
          ...base,
          summary: required
            ? `Lo spazio libero non basta: servono ${requirements.storageGb} GB.`
            : `Lo spazio libero basta di poco (${gap}).`,
          parts: [],
          tips: storageTips(pc, requirements.storageGb)
        })
        break
      case 'os':
        if (!required) break
        upgrades.push({
          ...base,
          summary: 'Il gioco non è fatto per il tuo sistema operativo.',
          parts: [],
          tips: osTips(row, pc)
        })
        break
    }
  }
  // Required first, then in the table's order.
  return upgrades.sort(
    (a, b) => Number(b.priority === 'required') - Number(a.priority === 'required')
  )
}
