import type { Result } from './auth'

// One saved comparison ("Confronta con il mio PC"), from the API's ComparisonHistory table.
export interface HistoryEntry {
  id: number
  appId: number
  gameName: string
  cpuName: string | null
  gpuName: string | null
  ramGb: number | null
  met: number
  failed: number
  toCheck: number
  date: string // ISO time of the latest comparison
}

// What the comparison page records.
export type HistoryRecord = Omit<HistoryEntry, 'id' | 'date'>

// What the preload exposes to the renderer as window.api.history.
export interface HistoryApi {
  list(): Promise<Result<HistoryEntry[]>>
  record(entry: HistoryRecord): Promise<Result<HistoryEntry>>
  remove(id: number): Promise<Result<null>>
  clear(): Promise<Result<null>>
}

export const historyChannels = {
  list: 'history:list',
  record: 'history:record',
  remove: 'history:remove',
  clear: 'history:clear'
} as const

const isCount = (n: unknown): n is number => Number.isSafeInteger(n) && (n as number) >= 0
const isName = (s: unknown): boolean => s === null || (typeof s === 'string' && s.length <= 255)

// Checks what crosses the IPC bridge before it reaches the API.
export function isHistoryRecord(value: unknown): value is HistoryRecord {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    isCount(v.appId) &&
    (v.appId as number) > 0 &&
    typeof v.gameName === 'string' &&
    !!v.gameName.trim() &&
    v.gameName.length <= 255 &&
    isName(v.cpuName) &&
    isName(v.gpuName) &&
    (v.ramGb === null || isCount(v.ramGb)) &&
    isCount(v.met) &&
    isCount(v.failed) &&
    isCount(v.toCheck)
  )
}

// Turns one row from GET /history into an entry, or null if it isn't one.
export function toHistoryEntry(row: unknown): HistoryEntry | null {
  if (typeof row !== 'object' || row === null) return null
  const r = row as Record<string, unknown>
  const text = (s: unknown): string | null => (typeof s === 'string' && s ? s : null)
  const date = typeof r.updated_at === 'string' ? r.updated_at : r.created_at
  if (
    !isCount(r.id) ||
    !isCount(r.AppId) ||
    typeof r.GameName !== 'string' ||
    typeof date !== 'string' ||
    Number.isNaN(Date.parse(date))
  )
    return null
  return {
    id: r.id,
    appId: r.AppId,
    gameName: r.GameName,
    cpuName: text(r.CpuName),
    gpuName: text(r.GpuName),
    ramGb: isCount(r.RamGb) ? r.RamGb : null,
    met: isCount(r.Met) ? r.Met : 0,
    failed: isCount(r.Failed) ? r.Failed : 0,
    toCheck: isCount(r.ToCheck) ? r.ToCheck : 0,
    date
  }
}
