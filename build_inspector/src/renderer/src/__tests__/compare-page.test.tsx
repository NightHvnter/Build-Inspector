import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ScannedPc } from '@shared/types/scan'
import { CompareGame } from '../compare'
import { resetHardwareCatalogCache } from '../hooks/useHardwareCatalog'
import { resetPcScanCache } from '../hooks/usePcScan'

const requirements = vi.fn()
const scan = vi.fn()
const catalog = vi.fn()
const record = vi.fn()

const PC = {
  os: { platform: 'Windows', distro: 'Microsoft Windows 11 Pro', release: '10.0.26200' },
  cpu: { name: 'Intel Gen Intel® Core™ i7-12700K' },
  gpus: [{ name: 'AMD Radeon RX 7900 XT', model: '', vramMb: 20464 }],
  ram: { totalGb: 32 },
  freeStorageGb: 500
} as ScannedPc

beforeEach(() => {
  resetPcScanCache()
  resetHardwareCatalogCache()
  window.api = {
    account: {} as never,
    steam: { search: vi.fn(), requirements },
    scanner: { scan },
    hardware: { catalog },
    history: { list: vi.fn(), record, remove: vi.fn(), clear: vi.fn() }
  }
  requirements.mockResolvedValue({
    ok: true,
    data: {
      appId: 1091500,
      name: 'Cyberpunk 2077',
      minimum: [
        { kind: 'cpu', label: 'Processore', value: 'Core i7-6700 or Ryzen 5 1600' },
        { kind: 'ram', label: 'Memoria', value: '12 GB di RAM' }
      ],
      ramGb: 12,
      storageGb: null
    }
  })
  scan.mockResolvedValue(PC)
  record.mockResolvedValue({ ok: true, data: {} })
  catalog.mockResolvedValue({
    ok: true,
    data: {
      cpus: [
        { name: 'AMD Ryzen 5 1600', mark: 12240 },
        { name: 'Intel Core i7-12700K', mark: 34224 },
        { name: 'Intel Core i7-6700 @ 3.40GHz', mark: 8032 }
      ],
      gpus: [{ name: 'Radeon RX 7900 XT', mark: 29125 }]
    }
  })
})

afterEach(() => {
  cleanup()
  delete window.api
  requirements.mockReset()
  scan.mockReset()
  catalog.mockReset()
  record.mockReset()
})

function open(path: string): void {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/confronto/:appId" element={<CompareGame />} />
      </Routes>
    </MemoryRouter>
  )
}

it('compares the game with the scanned PC', async () => {
  open('/confronto/1091500')
  await screen.findByRole('heading', { name: 'Cyberpunk 2077' })
  expect(requirements).toHaveBeenCalledWith(1091500)
  await screen.findByText('Il tuo PC raggiunge i requisiti minimi')
  const table = screen.getByRole('table', { name: /requisiti minimi e componenti/i })
  const cpu = within(table).getByRole('row', { name: /processore/i })
  expect(cpu.textContent).toContain('Intel Core i7-12700K')
  within(cpu).getByText('Soddisfatto')
  const ram = within(table).getByRole('row', { name: /memoria/i })
  expect(ram.textContent).toContain('32 GB')
})

it('rejects an invalid game id without calling Steam', () => {
  open('/confronto/abc')
  screen.getByText('Gioco non valido.')
  expect(requirements).not.toHaveBeenCalled()
  expect(scan).not.toHaveBeenCalled()
})

it('saves the finished comparison to the history once', async () => {
  open('/confronto/1091500')
  await screen.findByText('Il tuo PC raggiunge i requisiti minimi')
  await waitFor(() => expect(record).toHaveBeenCalledTimes(1))
  expect(record).toHaveBeenCalledWith({
    appId: 1091500,
    gameName: 'Cyberpunk 2077',
    cpuName: 'Intel Core i7-12700K',
    gpuName: 'Radeon RX 7900 XT',
    ramGb: 32,
    met: 2,
    failed: 0,
    toCheck: 0
  })
})

it('says so when the comparison could not be saved', async () => {
  record.mockResolvedValue({ ok: false, message: 'La sessione è scaduta. Accedi di nuovo.' })
  open('/confronto/1091500')
  await screen.findByText(/Confronto non salvato nella cronologia: La sessione è scaduta/)
})
