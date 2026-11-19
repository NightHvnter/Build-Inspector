import { readPreference } from '../services/preferences'

// The parts "La mia build" holds. Every comparison uses them.
export interface BuildValues {
  cpuName: string
  gpuName: string
  ram: number
}

export type BuildField = keyof BuildValues
export const BUILD_FIELDS: BuildField[] = ['cpuName', 'gpuName', 'ram']

// Which parts the user picked by hand. A manual part is kept as saved; the others follow
// the latest scan of this PC.
export type ManualFields = Record<BuildField, boolean>

export const NO_MANUAL: ManualFields = { cpuName: false, gpuName: false, ram: false }

export interface SavedBuild extends BuildValues {
  manual: ManualFields
}

// The build in use: values plus where each one comes from.
export type MyBuild = SavedBuild

export const buildKey = (userId: string): string => 'bi.build.' + userId

function isValues(value: unknown): value is BuildValues {
  if (!value || typeof value !== 'object') return false
  const v = value as Partial<BuildValues>
  return (
    typeof v.cpuName === 'string' &&
    typeof v.gpuName === 'string' &&
    typeof v.ram === 'number' &&
    Number.isSafeInteger(v.ram) &&
    v.ram > 0
  )
}

// A saved build, also in the old format without `manual`: that one was saved by hand
// with the Save button, so every part counts as chosen by the user.
export function toSavedBuild(value: unknown): SavedBuild | null {
  if (!isValues(value)) return null
  const manual = (value as { manual?: unknown }).manual
  const flags =
    manual && typeof manual === 'object'
      ? (Object.fromEntries(
          BUILD_FIELDS.map((field) => [field, (manual as Record<string, unknown>)[field] === true])
        ) as ManualFields)
      : { cpuName: true, gpuName: true, ram: true }
  return { cpuName: value.cpuName, gpuName: value.gpuName, ram: value.ram, manual: flags }
}

export function readSavedBuild(userId: string): SavedBuild | null {
  const raw = readPreference<unknown>(
    buildKey(userId),
    null,
    (value): value is unknown => value !== undefined
  )
  return toSavedBuild(raw)
}

// Whether a saved value can be used: a part the API no longer lists is dropped.
export type IsKnown = (field: BuildField, value: string | number) => boolean

const filled = (value: string | number | undefined): boolean =>
  typeof value === 'number' ? value > 0 : !!value

// The build every comparison uses. A part chosen by hand stays as saved, whatever the scan
// says; the others come from the scan, or from the saved build when the scan can't tell.
export function effectiveBuild(
  saved: SavedBuild | null,
  detected: BuildValues | null,
  isKnown: IsKnown = () => true
): MyBuild | null {
  if (!saved && !detected) return null
  const pick = <F extends BuildField>(field: F): { value: BuildValues[F]; manual: boolean } => {
    const own = saved && filled(saved[field]) && isKnown(field, saved[field]) ? saved[field] : null
    if (own !== null && saved?.manual[field]) return { value: own, manual: true }
    if (detected && filled(detected[field])) return { value: detected[field], manual: false }
    return {
      value: (own ?? (field === 'ram' ? 0 : '')) as BuildValues[F],
      manual: own !== null && !!saved?.manual[field]
    }
  }
  const cpu = pick('cpuName')
  const gpu = pick('gpuName')
  const ram = pick('ram')
  return {
    cpuName: cpu.value,
    gpuName: gpu.value,
    ram: ram.value,
    manual: { cpuName: cpu.manual, gpuName: gpu.manual, ram: ram.manual }
  }
}
