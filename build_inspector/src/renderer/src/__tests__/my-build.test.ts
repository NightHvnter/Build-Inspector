import { expect, it } from 'vitest'
import { effectiveBuild, toSavedBuild } from '../data/myBuild'

const SCAN = { cpuName: 'Intel Core i7-12700K', gpuName: 'Radeon RX 7900 XT', ram: 32 }

it('uses the scan when nothing is saved', () => {
  expect(effectiveBuild(null, SCAN)).toEqual({
    ...SCAN,
    manual: { cpuName: false, gpuName: false, ram: false }
  })
})

it('keeps the parts chosen by hand and follows the scan for the others', () => {
  const saved = {
    cpuName: 'Old CPU',
    gpuName: 'GeForce RTX 3060',
    ram: 64,
    manual: { cpuName: false, gpuName: true, ram: true }
  }
  expect(effectiveBuild(saved, SCAN)).toEqual({
    cpuName: 'Intel Core i7-12700K', // not chosen by hand: a new scan replaces it
    gpuName: 'GeForce RTX 3060',
    ram: 64,
    manual: { cpuName: false, gpuName: true, ram: true }
  })
})

it('falls back to the saved part when the scan cannot tell', () => {
  const saved = toSavedBuild({
    cpuName: 'Intel Core i5-12400',
    gpuName: 'GeForce RTX 3060',
    ram: 16
  })!
  const unknownGpu = { ...SCAN, gpuName: '' }
  expect(
    effectiveBuild({ ...saved, manual: { cpuName: false, gpuName: false, ram: false } }, unknownGpu)
  ).toMatchObject({ gpuName: 'GeForce RTX 3060', manual: { gpuName: false } })
  expect(effectiveBuild(saved, null)).toMatchObject({ cpuName: 'Intel Core i5-12400', ram: 16 })
})

it('treats a build saved before this change as chosen by hand', () => {
  expect(toSavedBuild({ cpuName: 'A', gpuName: 'B', ram: 16 })?.manual).toEqual({
    cpuName: true,
    gpuName: true,
    ram: true
  })
  expect(toSavedBuild({ cpuName: 'A', gpuName: 'B', ram: 0 })).toBeNull()
})

it('drops a part the API no longer lists, even if chosen by hand', () => {
  const saved = {
    ...SCAN,
    gpuName: 'NVIDIA RTX 2060',
    manual: { cpuName: false, gpuName: true, ram: false }
  }
  const build = effectiveBuild(
    saved,
    SCAN,
    (field, value) => field !== 'gpuName' || value !== 'NVIDIA RTX 2060'
  )
  expect(build).toMatchObject({ gpuName: 'Radeon RX 7900 XT', manual: { gpuName: false } })
})
