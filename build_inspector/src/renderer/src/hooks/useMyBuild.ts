import { useMemo } from 'react'
import type { HardwareCatalog } from '@shared/types/hardware'
import type { ScannedPc } from '@shared/types/scan'
import { detectBuild } from '../data/hardware'
import { effectiveBuild, readSavedBuild, type MyBuild } from '../data/myBuild'
import { useAuth } from './useAuth'

// The build the comparisons use: "La mia build" of the signed-in user, where the parts
// chosen by hand stay as saved and the others follow this PC's scan. Guests get the scan.
export function useMyBuild(pc: ScannedPc | null, catalog: HardwareCatalog | null): MyBuild | null {
  const { user } = useAuth()
  // Read on every render of a new scan or catalog: a build saved on "La mia build" shows up
  // as soon as the user opens a comparison.
  return useMemo(() => {
    const saved = user ? readSavedBuild(user.id) : null
    const detected = pc && catalog ? detectBuild(pc, catalog) : null
    const known = catalog && {
      cpu: new Set(catalog.cpus.map((p) => p.name)),
      gpu: new Set(catalog.gpus.map((p) => p.name))
    }
    return effectiveBuild(
      saved,
      detected && { cpuName: detected.cpuName, gpuName: detected.gpuName, ram: detected.ram },
      (field, value) =>
        !known ||
        (field === 'cpuName'
          ? known.cpu.has(String(value))
          : field === 'gpuName'
            ? known.gpu.has(String(value))
            : true)
    )
  }, [user, pc, catalog])
}
