import { useCallback, useEffect, useState } from 'react'
import type { ScannedPc } from '@shared/types/scan'

interface PcScanState {
  pc: ScannedPc | null
  scanning: boolean
  error: string | null
  rescan: () => void
}

// One scan per app run: every game dialog reuses it until the user scans again.
let lastScan: Promise<ScannedPc> | null = null

export function resetPcScanCache(): void {
  lastScan = null
}

// Scans this PC's hardware through the main process (window.api.scanner) when enabled.
export function usePcScan(enabled: boolean): PcScanState {
  const scanner = window.api?.scanner
  const active = enabled && !!scanner
  const [round, setRound] = useState(0)
  const [result, setResult] = useState<{
    round: number
    pc: ScannedPc | null
    error: string | null
  }>({ round: -1, pc: null, error: null })

  useEffect(() => {
    if (!active || !scanner) return
    let cancelled = false
    lastScan ??= scanner.scan()
    const scan = lastScan
    scan
      .then((pc) => {
        if (!cancelled) setResult({ round, pc, error: null })
      })
      .catch(() => {
        if (lastScan === scan) lastScan = null
        if (!cancelled)
          setResult({ round, pc: null, error: 'Scansione del PC non riuscita. Riprova.' })
      })
    return () => {
      cancelled = true
    }
  }, [active, scanner, round])

  const rescan = useCallback(() => {
    lastScan = null
    setRound((n) => n + 1)
  }, [])

  if (!scanner)
    return {
      pc: null,
      scanning: false,
      error: 'La scansione è disponibile solo nell’app desktop.',
      rescan
    }
  const current = result.round === round
  return {
    // Keep showing the previous scan while a new one runs.
    pc: result.pc,
    scanning: active && !current,
    error: current ? result.error : null,
    rescan
  }
}
