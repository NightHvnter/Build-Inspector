import { useState } from 'react'
import { savePreference } from '../services/preferences'
import type { Result } from '../services/result'
import {
  NO_MANUAL,
  buildKey,
  effectiveBuild,
  readSavedBuild,
  type BuildValues,
  type IsKnown,
  type ManualFields,
  type SavedBuild
} from '../data/myBuild'

export type Build = BuildValues
const EMPTY_BUILD: Build = { cpuName: '', gpuName: '', ram: 16 }

interface BuildOptions {
  // Whether a saved part is still in the API's list; null while the list loads.
  isKnown: IsKnown | null
  // The values found by scanning this PC: the default for every part not chosen by hand.
  detected: Build | null
}

interface BuildState {
  build: Build
  // Which parts were chosen by hand (and so are never replaced by a scan).
  manual: ManualFields
  saved: boolean
  dirty: boolean
  feedback: Result<Build> | null
  updateBuild: (value: Partial<Build>) => void
  applyDetected: () => void
  saveBuild: () => void
}

const sameBuild = (a: SavedBuild, b: SavedBuild): boolean =>
  JSON.stringify([a.cpuName, a.gpuName, a.ram, a.manual]) ===
  JSON.stringify([b.cpuName, b.gpuName, b.ram, b.manual])

export function useBuild(userId: string, { isKnown, detected }: BuildOptions): BuildState {
  const key = buildKey(userId)
  const [savedBuild, setSavedBuild] = useState<SavedBuild | null>(() => readSavedBuild(userId))
  // What the user changed on this visit; until then the form shows the build in use.
  const [edited, setEdited] = useState<SavedBuild | null>(null)
  const [feedback, setFeedback] = useState<Result<Build> | null>(null)

  // Parts chosen by hand stay; the rest follow the scan (see data/myBuild.ts).
  const inUse = effectiveBuild(savedBuild, detected, isKnown ?? undefined) ?? {
    ...EMPTY_BUILD,
    manual: NO_MANUAL
  }
  const current = edited ?? inUse
  const build: Build = {
    cpuName: current.cpuName,
    gpuName: current.gpuName,
    ram: current.ram || EMPTY_BUILD.ram
  }

  // A part the user picks becomes "manual": later scans won't replace it.
  const updateBuild = (value: Partial<Build>): void => {
    const manual = { ...current.manual }
    for (const field of Object.keys(value) as (keyof Build)[]) manual[field] = true
    setEdited({ ...build, ...value, manual })
    setFeedback(null)
  }
  // Back to the scan: every part the scan recognised follows it again.
  const applyDetected = (): void => {
    if (!detected) return
    setEdited({
      cpuName: detected.cpuName || build.cpuName,
      gpuName: detected.gpuName || build.gpuName,
      ram: detected.ram || build.ram,
      manual: {
        cpuName: !detected.cpuName && current.manual.cpuName,
        gpuName: !detected.gpuName && current.manual.gpuName,
        ram: !detected.ram && current.manual.ram
      }
    })
    setFeedback(null)
  }
  const saveBuild = (): void => {
    if (!build.cpuName || !build.gpuName) {
      setFeedback({ ok: false, message: 'Scegli CPU e GPU prima di salvare.' })
      return
    }
    const next: SavedBuild = { ...build, manual: current.manual }
    const result = savePreference(key, next)
    setFeedback(result.ok ? { ok: true, data: build } : result)
    if (result.ok) {
      setSavedBuild(next)
      setEdited(null)
    }
  }
  return {
    build,
    manual: current.manual,
    saved: !!savedBuild,
    dirty: edited !== null && !sameBuild(edited, inUse),
    feedback,
    updateBuild,
    applyDetected,
    saveBuild
  }
}
