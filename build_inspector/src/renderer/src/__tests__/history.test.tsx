import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { HistoryPage } from '../history'
import { isHistoryRecord, toHistoryEntry } from '../../../shared/history'

const list = vi.fn()
const remove = vi.fn()
const clear = vi.fn()

const ROWS = [
  {
    id: 2,
    appId: 730,
    gameName: 'Counter-Strike 2',
    cpuName: 'Intel Core i7-12700K',
    gpuName: 'Radeon RX 7900 XT',
    ramGb: 32,
    met: 4,
    failed: 0,
    toCheck: 1,
    date: '2026-11-16T13:40:00.000Z'
  },
  {
    id: 1,
    appId: 1091500,
    gameName: 'Cyberpunk 2077',
    cpuName: null,
    gpuName: 'GeForce GT 710',
    ramGb: 8,
    met: 2,
    failed: 2,
    toCheck: 1,
    date: '2026-11-15T09:00:00.000Z'
  }
]

beforeEach(() => {
  window.api = {
    account: {} as never,
    steam: {} as never,
    history: { list, record: vi.fn(), remove, clear }
  }
  list.mockResolvedValue({ ok: true, data: ROWS })
  remove.mockResolvedValue({ ok: true, data: null })
  clear.mockResolvedValue({ ok: true, data: null })
})

afterEach(() => {
  cleanup()
  delete window.api
  vi.resetAllMocks()
})

function open(): void {
  render(
    <MemoryRouter>
      <HistoryPage />
    </MemoryRouter>
  )
}

it('lists the saved comparisons with a link to compare again', async () => {
  open()
  const table = await screen.findByRole('table', { name: 'Cronologia dei confronti' })
  const rows = within(table).getAllByRole('row').slice(1)
  expect(rows[0].textContent).toContain('Counter-Strike 2')
  expect(rows[0].textContent).toContain('Intel Core i7-12700K · Radeon RX 7900 XT · 32 GB')
  within(rows[0]).getByText('Da verificare')
  within(rows[1]).getByText('Insufficiente')
  const again = within(rows[1]).getByRole('link', { name: 'Confronta di nuovo Cyberpunk 2077' })
  expect(again.getAttribute('href')).toBe('/confronto/1091500')
})

it('deletes one entry, and all of them after confirming', async () => {
  open()
  fireEvent.click(
    await screen.findByRole('button', { name: 'Elimina Cyberpunk 2077 dalla cronologia' })
  )
  expect(remove).toHaveBeenCalledWith(1)
  await waitFor(() => expect(screen.queryByText('Cyberpunk 2077')).toBeNull())

  fireEvent.click(screen.getByRole('button', { name: 'Cancella cronologia' }))
  expect(clear).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Cancella tutto' }))
  expect(clear).toHaveBeenCalledTimes(1)
  await screen.findByText('Nessun confronto salvato.')
})

it('shows the API error and keeps the entries when a delete fails', async () => {
  remove.mockResolvedValue({ ok: false, message: 'La sessione è scaduta. Accedi di nuovo.' })
  open()
  fireEvent.click(
    await screen.findByRole('button', { name: 'Elimina Cyberpunk 2077 dalla cronologia' })
  )
  await screen.findByText('La sessione è scaduta. Accedi di nuovo.')
  screen.getByText('Cyberpunk 2077')
})

it('checks entries crossing the bridge and rows coming from the API', () => {
  const record: Record<string, unknown> = { ...ROWS[0] }
  delete record.id
  delete record.date
  expect(isHistoryRecord(record)).toBe(true)
  expect(isHistoryRecord({ ...record, appId: -1 })).toBe(false)
  expect(isHistoryRecord({ ...record, gameName: ' ' })).toBe(false)
  expect(isHistoryRecord({ ...record, met: 1.5 })).toBe(false)
  expect(isHistoryRecord({ ...record, cpuName: 'x'.repeat(256) })).toBe(false)
  expect(
    toHistoryEntry({
      id: 3,
      AppId: 730,
      GameName: 'Counter-Strike 2',
      CpuName: null,
      GpuName: '',
      RamGb: 32,
      Met: 4,
      Failed: 0,
      ToCheck: 1,
      created_at: '2026-11-16T13:00:00.000Z',
      updated_at: '2026-11-16T13:40:00.000Z'
    })
  ).toEqual({ ...ROWS[0], id: 3, cpuName: null, gpuName: null })
  expect(toHistoryEntry({ id: 'x' })).toBeNull()
})
