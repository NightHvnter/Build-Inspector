import { expect, it } from 'vitest'
import type { ScannedPc } from '@shared/types/scan'
import { compareWithPc } from '../data/compare'

const WINDOWS_11 = {
  platform: 'Windows',
  distro: 'Microsoft Windows 11 Pro',
  release: '10.0.26200'
}
const WINDOWS_10 = {
  platform: 'Windows',
  distro: 'Microsoft Windows 10 Home',
  release: '10.0.19045'
}
const WINDOWS_7 = {
  platform: 'Windows',
  distro: 'Microsoft Windows 7 Ultimate',
  release: '6.1.7601'
}
const LINUX = { platform: 'linux', distro: 'Ubuntu', release: '24.04' }
const MAC = { platform: 'darwin', distro: 'macOS', release: '15.1' }

function osVerdict(required: string, os: ScannedPc['os']): string {
  const pc = { os, cpu: { name: '' }, gpus: [], ram: { totalGb: 16 } } as unknown as ScannedPc
  const [row] = compareWithPc(
    {
      appId: 1,
      name: 'Gioco',
      minimum: [{ kind: 'os', label: 'Sistema operativo', value: required }],
      ramGb: null,
      storageGb: null
    },
    pc,
    null
  )
  return row.verdict
}

it('passes Windows 10 and 11 either way round', () => {
  expect(osVerdict('Windows 10 64-bit', WINDOWS_11)).toBe('ok')
  expect(osVerdict('Windows 11', WINDOWS_10)).toBe('ok')
  expect(osVerdict('Windows® 10/11 (64 bit)', WINDOWS_11)).toBe('ok')
})

it('passes a requirement that names no version', () => {
  expect(osVerdict('Sistema operativo a 64 bit', WINDOWS_11)).toBe('ok')
})

it('asks to check games that list a Windows older than 10', () => {
  expect(osVerdict('Windows 7 SP1 64-bit', WINDOWS_11)).toBe('check')
  expect(osVerdict('Windows 7, 8.1, 10', WINDOWS_11)).toBe('check')
  expect(osVerdict('Windows XP / Vista', WINDOWS_10)).toBe('check')
})

it('fails a PC on a different system', () => {
  expect(osVerdict('Windows 10 64-bit', LINUX)).toBe('low')
  expect(osVerdict('Windows 10 64-bit', MAC)).toBe('low')
  expect(osVerdict('Ubuntu 22.04', WINDOWS_11)).toBe('low')
})

it('passes the same non-Windows system', () => {
  expect(osVerdict('macOS 12 Monterey', MAC)).toBe('ok')
  expect(osVerdict('SteamOS / Ubuntu 22.04', LINUX)).toBe('ok')
})

it('fails a PC older than Windows 10 when the game needs 10 or later', () => {
  expect(osVerdict('Windows 10', WINDOWS_7)).toBe('low')
})
