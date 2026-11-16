import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ScannedPc } from '@shared/types/scan'
import { PostRegistrazione } from '../post-registrazione'
import { resetHardwareCatalogCache } from '../hooks/useHardwareCatalog'
import { resetPcScanCache } from '../hooks/usePcScan'

const catalog = vi.fn()
const scan = vi.fn()

const CATALOG = {
  cpus: [
    { name: 'AMD Ryzen 5 5600X', mark: 21820 },
    { name: 'Intel Core i7-12700K', mark: 34224 },
    { name: 'Intel Core i9-14900K', mark: 58149 }
  ],
  gpus: [
    { name: 'GeForce RTX 3060', mark: 16871 },
    { name: 'GeForce RTX 4090', mark: 38016 },
    { name: 'Radeon RX 7900 XT', mark: 29125 }
  ]
}

const PC = {
  cpu: { name: 'Intel Gen Intel® Core™ i7-12700K' },
  gpus: [{ name: 'AMD Radeon RX 7900 XT', model: 'AMD Radeon RX 7900 XT' }],
  ram: { totalGb: 32 }
} as ScannedPc

beforeEach(() => {
  localStorage.clear()
  resetHardwareCatalogCache()
  resetPcScanCache()
  window.api = {
    account: {} as never,
    steam: {} as never,
    scanner: { scan },
    hardware: { catalog }
  }
  catalog.mockResolvedValue({ ok: true, data: CATALOG })
  scan.mockResolvedValue(PC)
})

afterEach(() => {
  cleanup()
  delete window.api
  catalog.mockReset()
  scan.mockReset()
})

function value(label: string): string {
  return (screen.getByLabelText(label) as HTMLInputElement).value
}

it('fills the form from the scan with the names from the API', async () => {
  render(<PostRegistrazione userId="u1" />)
  await screen.findByText(/Componenti bilanciati nel modello|Differenza tra i componenti/)
  expect(catalog).toHaveBeenCalledTimes(1)
  expect(scan).toHaveBeenCalledTimes(1)
  expect(value('CPU')).toBe('Intel Core i7-12700K')
  expect(value('GPU')).toBe('Radeon RX 7900 XT')
  expect(screen.getByRole('combobox', { name: 'RAM' }).textContent).toBe('32 GB')
  expect(screen.getByText('Modifiche da salvare')).toBeTruthy()
  expect(screen.queryByText('Prestazioni simulate')).toBeNull()
})

it('keeps a saved build and can switch back to the scanned parts', async () => {
  localStorage.setItem(
    'bi.build.u1',
    JSON.stringify({ cpuName: 'AMD Ryzen 5 5600X', gpuName: 'GeForce RTX 3060', ram: 16 })
  )
  render(<PostRegistrazione userId="u1" />)
  await screen.findByText(/Componenti bilanciati nel modello|Differenza tra i componenti/)
  expect(value('CPU')).toBe('AMD Ryzen 5 5600X')
  expect(screen.getByText('Nessuna modifica in sospeso')).toBeTruthy()
  const detect = await screen.findByRole('button', { name: 'Rileva dal mio PC' })
  fireEvent.click(detect)
  expect(value('CPU')).toBe('Intel Core i7-12700K')
  expect(value('GPU')).toBe('Radeon RX 7900 XT')
})

it('replaces a saved build from the old built-in list with the scanned parts', async () => {
  localStorage.setItem(
    'bi.build.u1',
    JSON.stringify({ cpuName: 'AMD Ryzen 5 3600', gpuName: 'NVIDIA RTX 2060', ram: 16 })
  )
  render(<PostRegistrazione userId="u1" />)
  await screen.findByText(/Componenti bilanciati nel modello|Differenza tra i componenti/)
  expect(value('GPU')).toBe('Radeon RX 7900 XT')
})

it('shows the API error and asks again on retry', async () => {
  catalog.mockResolvedValueOnce({ ok: false, message: 'Elenco dei componenti non raggiungibile.' })
  render(<PostRegistrazione userId="u1" />)
  fireEvent.click(await screen.findByRole('button', { name: 'Riprova' }))
  await screen.findByText(/Componenti bilanciati nel modello|Differenza tra i componenti/)
  expect(catalog).toHaveBeenCalledTimes(2)
})
