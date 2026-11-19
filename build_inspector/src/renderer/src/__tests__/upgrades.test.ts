import { describe, expect, it } from 'vitest'
import type { ScannedPc } from '@shared/types/scan'
import type { GameRequirements } from '@shared/types/steam'
import { compareWithPc } from '../data/compare'
import { cpuSocket, suggestUpgrades, type Upgrade } from '../data/upgrades'

const CATALOG = {
  cpus: [
    { name: 'Intel Core i5-6500 @ 3.20GHz', mark: 5600 },
    { name: 'Intel Core i7-7700K @ 4.20GHz', mark: 9700 },
    { name: 'Intel Core i7-6700 @ 3.40GHz', mark: 8000 },
    { name: 'Intel Core i5-12400', mark: 18800 },
    { name: 'Intel Core i5-12400H', mark: 19000 }, // laptop: never suggested
    { name: 'AMD Ryzen 5 2600', mark: 13000 },
    { name: 'AMD Ryzen 5 3600', mark: 17700 },
    { name: 'AMD Ryzen 5 1600', mark: 12200 },
    { name: 'AMD Ryzen 5 8500G', mark: 19400 },
    { name: 'AMD Ryzen 7 5800X3D', mark: 28000 },
    { name: 'AMD EPYC 7763', mark: 90000 } // server: never suggested
  ],
  gpus: [
    { name: 'GeForce GTX 960', mark: 6100 },
    { name: 'GeForce GTX 1060 6GB', mark: 10000 },
    { name: 'GeForce RTX 3060', mark: 17000 },
    { name: 'GeForce RTX 4060 Laptop GPU', mark: 18000 }, // laptop: never suggested
    { name: 'Radeon RX 7600', mark: 16500 },
    { name: 'Intel Arc B580', mark: 16100 },
    { name: 'Radeon RX 580', mark: 8800 }
  ]
}

function pc(cpu: string, gpu: string, ramGb: number, extra: Partial<ScannedPc> = {}): ScannedPc {
  return {
    scannedAt: '',
    os: { platform: 'Windows', distro: 'Microsoft Windows 11 Home', release: '10' },
    cpu: { name: cpu, cores: 6, threads: 12, baseClockGhz: 3, socket: '' },
    gpus: [{ name: gpu, model: '', vendor: '', vramMb: 4096 }],
    ram: {
      totalGb: ramGb,
      modules: [{ sizeGb: ramGb / 2, type: 'DDR4', speedMhz: 3200, partNumber: '' }]
    },
    storage: [],
    freeStorageGb: 500,
    motherboard: { manufacturer: '', model: '' },
    ...extra
  }
}

const GAME: GameRequirements = {
  appId: 1,
  name: 'Gioco',
  ramGb: 16,
  storageGb: 70,
  minimum: [
    { kind: 'os', label: 'Sistema operativo', value: 'Windows 10 64-bit' },
    { kind: 'cpu', label: 'Processore', value: 'Core i7-6700 or Ryzen 5 1600' },
    { kind: 'ram', label: 'Memoria', value: '16 GB di RAM' },
    { kind: 'gpu', label: 'Scheda video', value: 'GeForce GTX 1060 6GB' },
    { kind: 'storage', label: 'Archiviazione', value: '70 GB di spazio' }
  ]
}

const advise = (machine: ScannedPc): Upgrade[] =>
  suggestUpgrades(compareWithPc(GAME, machine, CATALOG), GAME, machine, CATALOG)

describe('cpuSocket', () => {
  it('tells desktop sockets apart, LGA1151 generations included', () => {
    expect(cpuSocket('Intel Core i5-6500 @ 3.20GHz')).toBe('LGA1151')
    expect(cpuSocket('Intel Core i7-9700K')).toBe('LGA1151 v2')
    expect(cpuSocket('Intel Core i5-10400F')).toBe('LGA1200')
    expect(cpuSocket('Intel Core i5-13400F')).toBe('LGA1700')
    expect(cpuSocket('Intel Core Ultra 5 225F')).toBe('LGA1851')
    expect(cpuSocket('AMD Ryzen 5 5600X3D')).toBe('AM4')
    expect(cpuSocket('AMD Ryzen 7 7800X3D')).toBe('AM5')
  })

  it('leaves out laptop, server and low-power models', () => {
    for (const name of [
      'Intel Core i5-12400H',
      'Intel Core i7-1165G7',
      'AMD Ryzen 5 5600U',
      'AMD Ryzen 5 5600GE',
      'AMD EPYC 7763',
      'Intel Core i5-13400T'
    ])
      expect(cpuSocket(name)).toBeNull()
  })
})

describe('suggestUpgrades', () => {
  it('gives nothing when every component has a good margin', () => {
    expect(advise(pc('Intel Core i5-12400', 'NVIDIA GeForce RTX 3060', 32))).toEqual([])
  })

  it('suggests a processor for the same motherboard when one is fast enough', () => {
    const demanding: GameRequirements = {
      ...GAME,
      minimum: [{ kind: 'cpu', label: 'Processore', value: 'Ryzen 5 3600' }]
    }
    const machine = pc('AMD Ryzen 5 2600 Six-Core Processor', 'GeForce RTX 3060', 32)
    const [cpu] = suggestUpgrades(
      compareWithPc(demanding, machine, CATALOG),
      demanding,
      machine,
      CATALOG
    )
    expect(cpu).toMatchObject({ kind: 'cpu', priority: 'required' })
    expect(cpu.parts.map((p) => [p.name, p.note])).toEqual([
      ['AMD Ryzen 7 5800X3D', 'Compatibile con la tua scheda madre (AM4).']
    ])
  })

  it('suggests a new platform when the motherboard can go no further', () => {
    const upgrades = advise(pc('Intel(R) Core(TM) i5-6500 CPU @ 3.20GHz', 'GeForce GTX 960', 8))
    expect(upgrades.map((u) => [u.kind, u.priority])).toEqual([
      ['cpu', 'required'],
      ['ram', 'required'],
      ['gpu', 'required']
    ])
    const cpu = upgrades[0]
    expect(cpu.parts.map((p) => p.name)).toEqual(['AMD Ryzen 5 8500G', 'Intel Core i5-12400'])
    expect(cpu.parts[0].note).toBe(
      'Non entra nella tua scheda madre (LGA1151): serve una scheda madre AM5 e memoria DDR5.'
    )
    // Scores against the requirement and the gain over the PC's own processor.
    expect(cpu.parts[1]).toMatchObject({ score: 235, gain: 236 })
  })

  it('suggests one desktop graphics card per brand, the weakest that is enough', () => {
    const gpu = advise(pc('Intel Core i5-12400', 'GeForce GTX 960', 32)).find(
      (u) => u.kind === 'gpu'
    )!
    expect(gpu.priority).toBe('required')
    expect(gpu.parts.map((p) => p.name)).toEqual([
      'Intel Arc B580',
      'Radeon RX 7600',
      'GeForce RTX 3060'
    ])
    expect(gpu.tips[0]).toMatch(/alimentatore/)
  })

  it('sizes a memory kit like the modules already in the PC', () => {
    const ram = advise(pc('Intel Core i5-12400', 'GeForce RTX 3060', 8)).find(
      (u) => u.kind === 'ram'
    )!
    expect(ram.summary).toBe('Hai 8 GB di memoria, il gioco ne chiede 16.')
    expect(ram.tips[0]).toBe(
      'Porta la memoria a 16 GB: per esempio un kit 2 × 8 GB DDR4 3200 MHz, come i moduli che hai già.'
    )
    // Exactly the minimum: an optional step up.
    const tight = advise(pc('Intel Core i5-12400', 'GeForce RTX 3060', 16)).find(
      (u) => u.kind === 'ram'
    )!
    expect(tight.priority).toBe('recommended')
    expect(tight.tips[0]).toMatch(/^Porta la memoria a 32 GB/)
  })

  it('suggests freeing space or a new SSD', () => {
    const storage = advise(
      pc('Intel Core i5-12400', 'GeForce RTX 3060', 32, { freeStorageGb: 40 })
    ).find((u) => u.kind === 'storage')!
    expect(storage.tips).toEqual([
      'Libera almeno 30 GB: disinstalla giochi che non usi o svuota la cartella Download.',
      'Oppure aggiungi un SSD da 500 GB: i giochi si caricano molto più in fretta che da un disco tradizionale.'
    ])
  })

  it('points Linux users to Proton when the game wants Windows', () => {
    const os = advise(
      pc('Intel Core i5-12400', 'GeForce RTX 3060', 32, {
        os: { platform: 'linux', distro: 'Ubuntu', release: '24.04' }
      })
    ).find((u) => u.kind === 'os')!
    expect(os.priority).toBe('required')
    expect(os.tips.join(' ')).toMatch(/Proton/)
  })
})
