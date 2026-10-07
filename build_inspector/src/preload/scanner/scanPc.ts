import si from 'systeminformation'
import type { ScannedPc } from '@shared/types'

const bytesToGb = (b: number): number => Math.round(b / 1024 ** 3)

async function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise
  } catch {
    return fallback
  }
}

export async function scanPc(): Promise<ScannedPc> {
  const [cpu, gfx, mem, layout, disks, board, os] = await Promise.all([
    safe(si.cpu(), null),
    safe(si.graphics(), null),
    safe(si.mem(), null),
    safe(si.memLayout(), []),
    safe(si.diskLayout(), []),
    safe(si.baseboard(), null),
    safe(si.osInfo(), null)
  ])

  return {
    scannedAt: new Date().toISOString(),
    os: { platform: os?.platform ?? '', distro: os?.distro ?? '', release: os?.release ?? '' },
    cpu: {
      name: cpu ? `${cpu.manufacturer} ${cpu.brand}`.trim() : '',
      cores: cpu?.physicalCores ?? 0,
      threads: cpu?.cores ?? 0,
      baseClockGhz: Number(cpu?.speed ?? 0),
      socket: cpu?.socket ?? ''
    },
    gpus: (gfx?.controllers ?? []).map((g) => {
      const c = g as { name?: string; model?: string; vendor?: string; vram?: number | null }
      return {
        name: (c.name || c.model || '').trim(), 
        model: (c.model || '').trim(),
        vendor: c.vendor ?? '',
        vramMb: c.vram ?? 0
      }
    }),
    ram: {
      totalGb: mem ? bytesToGb(mem.total) : 0,
      modules: layout.map((m) => ({
        sizeGb: bytesToGb(m.size),
        type: m.type ?? '',
        speedMhz: m.clockSpeed ?? 0,
        partNumber: (m.partNum ?? '').trim() // never collect serial numbers
      }))
    },
    storage: disks.map((d) => ({
      name: d.name ?? '',
      type: d.type ?? '',
      sizeGb: bytesToGb(d.size)
    })),
    motherboard: { manufacturer: board?.manufacturer ?? '', model: board?.model ?? '' }
  }
}