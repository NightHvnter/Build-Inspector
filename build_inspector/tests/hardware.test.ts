import { expect, it } from 'vitest'
import { toParts } from '../src/preload/hardware/hardwareCalls'
import {
  cpuScore,
  detectBuild,
  gpuScore,
  matchPart,
  ramOptions
} from '../src/renderer/src/data/hardware'
import type { ScannedPc } from '../src/preload/shared/types/scan'

// Real names and marks from the API (GET /cpu, GET /gpu).
const CPUS = toParts([
  { Name: 'Intel Core i7-12700K', Mark: 34224 },
  { Name: 'Intel Core i7-12700KF', Mark: 33880 },
  { Name: 'Intel Core i5-8400 @ 2.80GHz', Mark: 9213 },
  { Name: 'AMD Ryzen 5 5600X', Mark: 21820 },
  { Name: 'AMD Ryzen 5 5600X3D', Mark: 21939 },
  { Name: 'Intel Core i9-14900K', Mark: 58149 }
])
const GPUS = toParts([
  { Name: 'GeForce RTX 3060', Mark: 16871 },
  { Name: 'GeForce RTX 3060 Ti', Mark: 20206 },
  { Name: 'GeForce RTX 3060 Laptop GPU', Mark: 13092 },
  { Name: 'Radeon RX 7900 XT', Mark: 29125 },
  { Name: 'Radeon RX 7900 XTX', Mark: 31473 },
  { Name: 'Intel UHD Graphics 770', Mark: 1907 },
  { Name: 'GeForce RTX 4090', Mark: 38016 }
])

it('matches scanned names to the API names, ignoring extra words and symbols', () => {
  expect(matchPart('Intel Gen Intel® Core™ i7-12700K', CPUS)?.name).toBe('Intel Core i7-12700K')
  expect(matchPart('AMD Ryzen 5 5600X 6-Core Processor', CPUS)?.name).toBe('AMD Ryzen 5 5600X')
  expect(matchPart('Intel(R) Core(TM) i5-8400 CPU @ 2.80GHz', CPUS)?.name).toBe(
    'Intel Core i5-8400 @ 2.80GHz'
  )
  expect(matchPart('NVIDIA GeForce RTX 3060', GPUS)?.name).toBe('GeForce RTX 3060')
  expect(matchPart('NVIDIA GeForce RTX 3060 Laptop GPU', GPUS)?.name).toBe(
    'GeForce RTX 3060 Laptop GPU'
  )
  expect(matchPart('AMD Radeon RX 7900 XT', GPUS)?.name).toBe('Radeon RX 7900 XT')
})

it('finds nothing rather than a wrong part', () => {
  expect(matchPart('AMD Radeon(TM) Graphics', GPUS)).toBeNull()
  expect(matchPart('Apple M2', CPUS)).toBeNull()
  expect(matchPart('', CPUS)).toBeNull()
})

it('fills the form from a scan, choosing the faster of two GPUs', () => {
  const pc = {
    cpu: { name: 'Intel Gen Intel® Core™ i7-12700K' },
    gpus: [
      { name: 'Intel(R) UHD Graphics 770', model: '' },
      { name: 'AMD Radeon RX 7900 XT', model: '' }
    ],
    ram: { totalGb: 32 }
  } as ScannedPc
  expect(detectBuild(pc, { cpus: CPUS, gpus: GPUS })).toEqual({
    cpuName: 'Intel Core i7-12700K',
    gpuName: 'Radeon RX 7900 XT',
    ram: 32,
    scannedCpu: 'Intel Gen Intel® Core™ i7-12700K',
    scannedGpus: ['Intel(R) UHD Graphics 770', 'AMD Radeon RX 7900 XT']
  })
})

it('scales marks so the i9-14900K and RTX 4090 score 100', () => {
  expect(cpuScore(58149, CPUS)).toBe(100)
  expect(gpuScore(38016, GPUS)).toBe(100)
  expect(cpuScore(21820, CPUS)).toBe(61)
  expect(gpuScore(16871, GPUS)).toBe(52)
  expect(gpuScore(1, GPUS)).toBe(1)
  expect(cpuScore(10_000_000, CPUS)).toBe(150)
})

it('keeps valid parts only and the higher mark for a repeated name', () => {
  expect(
    toParts([
      { Name: 'GeForce GT 710', Mark: 600 },
      { Name: 'GeForce GT 710', Mark: 650 },
      { Name: '', Mark: 1 },
      { Name: 'Broken', Mark: 0 },
      { Name: 'No mark' },
      null
    ])
  ).toEqual([{ name: 'GeForce GT 710', mark: 650 }])
  expect(toParts({})).toEqual([])
})

it('offers the usual RAM sizes plus the ones in use', () => {
  expect(ramOptions(24, 16, 0)).toEqual([8, 16, 24, 32, 64])
})
