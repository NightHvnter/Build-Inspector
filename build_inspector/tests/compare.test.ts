import { expect, it } from 'vitest'
import { compareWithPc, summarize } from '../src/renderer/src/data/compare'
import { matchRequirement } from '../src/renderer/src/data/hardware'
import type { ScannedPc } from '../src/preload/shared/types/scan'
import type { GameRequirements } from '../src/preload/shared/types/steam'

// Real names and marks from the API (GET /cpu, GET /gpu).
const CATALOG = {
  cpus: [
    { name: 'AMD FX-6300 Six-Core', mark: 4006 },
    { name: 'AMD Ryzen 5 1600', mark: 12240 },
    { name: 'AMD Ryzen 5 1600X', mark: 12997 },
    { name: 'Intel Core i5-750 @ 2.67GHz', mark: 2508 },
    { name: 'Intel Core i7-6700 @ 3.40GHz', mark: 8032 },
    { name: 'Intel Core i7-6700K @ 4.00GHz', mark: 8955 },
    { name: 'Intel Core i3-4130 @ 3.40GHz', mark: 3137 },
    { name: 'Intel Core i7-12700K', mark: 34224 }
  ],
  gpus: [
    { name: 'GeForce GTX 1060', mark: 10010 },
    { name: 'GeForce GTX 1060 6GB', mark: 10226 },
    { name: 'Radeon RX 580', mark: 8781 },
    { name: 'Intel Arc A380', mark: 6334 },
    { name: 'GeForce GT 710', mark: 637 },
    { name: 'Radeon RX 7900 XT', mark: 29125 }
  ]
}

it('reads the alternatives Steam lists, with or without brand names', () => {
  const names = (text: string, kind: 'cpus' | 'gpus'): string[] =>
    matchRequirement(text, CATALOG[kind]).map((part) => part.name)
  expect(names('Core i7-6700 or Ryzen 5 1600', 'cpus')).toEqual([
    'Intel Core i7-6700 @ 3.40GHz',
    'AMD Ryzen 5 1600'
  ])
  expect(names('CPU con 4 thread hardware - Intel® Core™ i5 750 o superiore', 'cpus')).toEqual([
    'Intel Core i5-750 @ 2.67GHz'
  ])
  expect(names('Intel Core i5-4460 / AMD FX-6300', 'cpus')).toEqual(['AMD FX-6300 Six-Core'])
  expect(names('GeForce GTX 1060 6GB or Radeon RX 580 8GB or Arc A380', 'gpus')).toEqual([
    'GeForce GTX 1060 6GB',
    'Radeon RX 580',
    'Intel Arc A380'
  ])
  expect(names('Dual core from Intel or AMD at 2.8 GHz', 'cpus')).toEqual([])
})

const CYBERPUNK: GameRequirements = {
  appId: 1091500,
  name: 'Cyberpunk 2077',
  minimum: [
    { kind: 'os', label: 'Sistema operativo', value: '64-bit Windows 10' },
    { kind: 'cpu', label: 'Processore', value: 'Core i7-6700 or Ryzen 5 1600' },
    { kind: 'ram', label: 'Memoria', value: '12 GB di RAM' },
    { kind: 'gpu', label: 'Scheda video', value: 'GeForce GTX 1060 6GB or Radeon RX 580 8GB' },
    { kind: 'directx', label: 'DirectX', value: 'Versione 12' },
    { kind: 'storage', label: 'Archiviazione', value: '70 GB di spazio disponibile' }
  ],
  ramGb: 12,
  storageGb: 70
}

const PC = {
  os: { platform: 'Windows', distro: 'Microsoft Windows 11 Pro', release: '10.0.26200' },
  cpu: { name: 'Intel Gen Intel® Core™ i7-12700K' },
  gpus: [{ name: 'AMD Radeon RX 7900 XT', model: '', vramMb: 20464 }],
  ram: { totalGb: 8 },
  freeStorageGb: 500
} as ScannedPc

it('compares each requirement with the scanned PC', () => {
  const rows = compareWithPc(CYBERPUNK, PC, CATALOG)
  expect(rows.map((row) => [row.label, row.yours, row.verdict])).toEqual([
    ['Sistema operativo', 'Microsoft Windows 11 Pro 10.0.26200', 'check'],
    ['Processore', 'Intel Core i7-12700K', 'ok'],
    ['Memoria', '8 GB', 'low'],
    ['Scheda video', 'Radeon RX 7900 XT', 'ok'],
    ['DirectX', '', 'info'],
    ['Archiviazione', '500 GB liberi', 'ok']
  ])
  // The weakest listed alternative is the bar to clear.
  // Italian formatting groups digits from 5 digits on: 34.224, but 8032.
  expect(rows[1].detail).toBe('PassMark: 34.224 contro 8032 (Intel Core i7-6700 @ 3.40GHz).')
  expect(rows[2].detail).toBe('Mancano 4 GB.')
  expect(summarize(rows)).toEqual({ ok: 3, low: 1, check: 1, info: 1 })
})

it('marks a weaker part as insufficient and unknown parts as to check', () => {
  const slow = { ...PC, cpu: { name: 'Intel(R) Core(TM) i3-4130 CPU @ 3.40GHz' } } as ScannedPc
  expect(compareWithPc(CYBERPUNK, slow, CATALOG)[1].verdict).toBe('low')
  const unknown = { ...PC, gpus: [{ name: 'AMD Radeon(TM) Graphics', model: '', vramMb: 0 }] }
  const gpu = compareWithPc(CYBERPUNK, unknown as ScannedPc, CATALOG)[3]
  expect([gpu.yours, gpu.verdict]).toEqual(['AMD Radeon(TM) Graphics', 'check'])
  // Without the API's list nothing can be scored.
  expect(compareWithPc(CYBERPUNK, PC, null)[1].verdict).toBe('check')
})

it('compares video memory when Steam names no graphics card', () => {
  const cs2: GameRequirements = {
    ...CYBERPUNK,
    minimum: [
      {
        kind: 'gpu',
        label: 'Scheda video',
        value: 'La scheda video deve essere dotata di almeno 1 GB di memoria'
      }
    ]
  }
  const [gpu] = compareWithPc(cs2, PC, CATALOG)
  expect([gpu.verdict, gpu.detail]).toEqual(['ok', '20 GB contro 1 GB richiesti.'])
})
