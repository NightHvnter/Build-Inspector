import { apiUrl } from '../apiUrl'
import type { HardwareCatalog, HardwareCatalogReply, HardwarePart } from '@shared/types/hardware'

// Keeps only well-formed parts and, for a name listed twice, the higher mark.
export function toParts(rows: unknown): HardwarePart[] {
  const byName = new Map<string, number>()
  for (const row of Array.isArray(rows) ? rows : []) {
    const { Name, Mark } = (row ?? {}) as { Name?: unknown; Mark?: unknown }
    if (typeof Name !== 'string' || !Name.trim() || typeof Mark !== 'number') continue
    if (!Number.isFinite(Mark) || Mark <= 0) continue
    const name = Name.trim().slice(0, 255)
    byName.set(name, Math.max(byName.get(name) ?? 0, Mark))
  }
  return [...byName]
    .map(([name, mark]) => ({ name, mark }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

async function getList(path: string): Promise<HardwarePart[]> {
  const response = await fetch(apiUrl(path), { signal: AbortSignal.timeout(15000) })
  if (!response.ok) throw new Error('HTTP ' + response.status)
  return toParts(await response.json())
}

// The lists change only when script/update_db.py runs, so the main process
// downloads them once per app run (and again after a failure).
let cached: Promise<HardwareCatalog> | null = null

export async function getHardwareCatalog(): Promise<HardwareCatalogReply> {
  cached ??= Promise.all([getList('/cpu'), getList('/gpu')]).then(([cpus, gpus]) => ({
    cpus,
    gpus
  }))
  try {
    const data = await cached
    if (!data.cpus.length || !data.gpus.length) {
      cached = null
      return {
        ok: false,
        message: 'Il database dei componenti è vuoto. Esegui script/update_db.py e riprova.'
      }
    }
    return { ok: true, data }
  } catch {
    cached = null
    return {
      ok: false,
      message: "Elenco dei componenti non raggiungibile. Controlla che l'API sia avviata."
    }
  }
}
