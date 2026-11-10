import { useState } from 'react'
import { CPUS, GPUS, RAM_OPTIONS } from '../data/hardware'
import { readPreference, savePreference } from '../services/preferences'
import type { Result } from '../services/result'

export interface Build {
  cpuName: string
  gpuName: string
  ram: number
}
const DEFAULT_BUILD: Build = { cpuName: CPUS[1].name, gpuName: GPUS[1].name, ram: 16 }

function isBuild(value: unknown): value is Build {
  if (!value || typeof value !== 'object') return false
  const build = value as Partial<Build>
  return (
    CPUS.some((cpu) => cpu.name === build.cpuName) &&
    GPUS.some((gpu) => gpu.name === build.gpuName) &&
    typeof build.ram === 'number' &&
    RAM_OPTIONS.includes(build.ram)
  )
}
interface BuildState {
  build: Build
  dirty: boolean
  feedback: Result<Build> | null
  updateBuild: (value: Partial<Build>) => void
  saveBuild: () => void
}

export function useBuild(userId: string): BuildState {
  const key = 'bi.build.' + userId
  const [savedBuild, setSavedBuild] = useState(() => readPreference(key, DEFAULT_BUILD, isBuild))
  const [build, setBuild] = useState(savedBuild)
  const [feedback, setFeedback] = useState<Result<Build> | null>(null)
  const updateBuild = (value: Partial<Build>): void => {
    setBuild((previous) => ({ ...previous, ...value }))
    setFeedback(null)
  }
  const saveBuild = (): void => {
    const result = savePreference(key, build)
    setFeedback(result)
    if (result.ok) setSavedBuild(build)
  }
  return {
    build,
    dirty: JSON.stringify(build) !== JSON.stringify(savedBuild),
    feedback,
    updateBuild,
    saveBuild
  }
}
