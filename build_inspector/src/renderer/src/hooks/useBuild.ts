import { useState } from 'react'
import { readPreference, savePreference } from '../services/preferences'
import type { Result } from '../services/result'

export interface Build {
  cpuName: string
  gpuName: string
  ram: number
}
const EMPTY_BUILD: Build = { cpuName: '', gpuName: '', ram: 16 }

function isBuild(value: unknown): value is Build {
  if (!value || typeof value !== 'object') return false
  const build = value as Partial<Build>
  return (
    typeof build.cpuName === 'string' &&
    !!build.cpuName &&
    typeof build.gpuName === 'string' &&
    !!build.gpuName &&
    typeof build.ram === 'number' &&
    Number.isSafeInteger(build.ram) &&
    build.ram > 0
  )
}

interface BuildOptions {
  // Whether a saved build still names parts the API knows; null while the list loads.
  isKnown: ((build: Build) => boolean) | null
  // The values found by scanning this PC, used until the user saves a build.
  detected: Build | null
}

interface BuildState {
  build: Build
  saved: boolean
  dirty: boolean
  feedback: Result<Build> | null
  updateBuild: (value: Partial<Build>) => void
  applyDetected: () => void
  saveBuild: () => void
}

export function useBuild(userId: string, { isKnown, detected }: BuildOptions): BuildState {
  const key = 'bi.build.' + userId
  const [savedBuild, setSavedBuild] = useState<Build | null>(() =>
    readPreference<Build | null>(key, null, (value): value is Build | null => isBuild(value))
  )
  // What the user changed on this visit; until then the form shows the saved build or the scan.
  const [edited, setEdited] = useState<Build | null>(null)
  const [feedback, setFeedback] = useState<Result<Build> | null>(null)

  // A build saved with the old built-in list may name parts the API doesn't have.
  const usableSaved = savedBuild && (!isKnown || isKnown(savedBuild)) ? savedBuild : null
  const build = edited ?? usableSaved ?? detected ?? EMPTY_BUILD

  const updateBuild = (value: Partial<Build>): void => {
    setEdited({ ...build, ...value })
    setFeedback(null)
  }
  // Fills the form from the scan, keeping the current choice for a part the scan couldn't match.
  const applyDetected = (): void => {
    if (!detected) return
    setEdited({
      cpuName: detected.cpuName || build.cpuName,
      gpuName: detected.gpuName || build.gpuName,
      ram: detected.ram || build.ram
    })
    setFeedback(null)
  }
  const saveBuild = (): void => {
    if (!isBuild(build)) {
      setFeedback({ ok: false, message: 'Scegli CPU e GPU prima di salvare.' })
      return
    }
    const result = savePreference(key, build)
    setFeedback(result)
    if (result.ok) {
      setSavedBuild(build)
      setEdited(null)
    }
  }
  return {
    build,
    saved: !!usableSaved,
    dirty: JSON.stringify(build) !== JSON.stringify(usableSaved ?? EMPTY_BUILD),
    feedback,
    updateBuild,
    applyDetected,
    saveBuild
  }
}
