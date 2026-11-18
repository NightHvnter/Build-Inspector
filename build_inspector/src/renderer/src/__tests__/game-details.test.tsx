import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ScannedPc } from '@shared/types/scan'
import { GameDetails } from '../components/catalog/GameDetails'
import { steamGame } from '../hooks/useSteamSearch'
import { resetPcScanCache } from '../hooks/usePcScan'
import { AuthContext, type AuthContextValue } from '../contexts/AuthContext'
import type { User } from '../types/auth'

const requirements = vi.fn()
const scan = vi.fn()

const PC: ScannedPc = {
  scannedAt: '2026-11-16T10:00:00.000Z',
  os: { platform: 'win32', distro: 'Windows 11 Pro', release: '10.0.26200' },
  cpu: { name: 'AMD Ryzen 5 5600X', cores: 6, threads: 12, baseClockGhz: 3.7, socket: 'AM4' },
  gpus: [{ name: 'NVIDIA GeForce RTX 3060', model: '', vendor: 'NVIDIA', vramMb: 12288 }],
  ram: { totalGb: 8, modules: [] },
  storage: [{ name: 'SSD', type: 'SSD', sizeGb: 1000 }],
  motherboard: { manufacturer: '', model: '' }
}

beforeEach(() => {
  resetPcScanCache()
  window.api = { account: {} as never, steam: { search: vi.fn(), requirements }, scanner: { scan } }
})

afterEach(() => {
  cleanup()
  delete window.api
  requirements.mockReset()
  scan.mockReset()
})

function open(user: User | null = null): void {
  render(
    <AuthContext.Provider value={{ ...authDefaults(), user }}>
      <MemoryRouter>
        <GameDetails
          game={steamGame(1091500, 'Cyberpunk 2077')}
          favorite={false}
          onClose={() => {}}
          onFavorite={() => {}}
        />
      </MemoryRouter>
    </AuthContext.Provider>
  )
}

function authDefaults(): AuthContextValue {
  return {
    user: null,
    initializing: false,
    configured: true,
    sessionError: '',
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    signInWithGoogle: vi.fn(),
    cancelBrowserSignIn: vi.fn()
  }
}

it('asks guests to log in before comparing with their PC', () => {
  requirements.mockReturnValue(new Promise(() => {}))
  scan.mockReturnValue(new Promise(() => {}))
  open()
  const guest = screen.getByRole('link', { name: 'Accedi per confrontare' })
  expect(guest.getAttribute('href')).toBe('/login?next=%2Fconfronto%2F1091500')
  cleanup()
  open({ id: '42', name: 'Test', email: 'test@example.com' })
  const member = screen.getByRole('link', { name: 'Confronta con il mio PC' })
  expect(member.getAttribute('href')).toBe('/confronto/1091500')
})

it('shows the minimum requirements from Steam and checks RAM against the scan', async () => {
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
  open()

  const table = await screen.findByRole('table', { name: /requisiti minimi/i })
  expect(requirements).toHaveBeenCalledWith(1091500)
  expect(scan).toHaveBeenCalledTimes(1)
  const cpu = within(table).getByRole('row', { name: /processore/i })
  expect(cpu.textContent).toContain('Core i7-6700 or Ryzen 5 1600')
  const ram = within(table).getByRole('row', { name: /memoria/i })
  await within(ram).findByText('Insufficiente')
  // The scan is used only for the RAM check: the PC's own specs are not shown.
  expect(table.textContent).not.toMatch(/Ryzen 5 5600X|RTX 3060|Windows 11/)
  expect(within(table).queryByText('Il tuo PC')).toBeNull()
})

it('keeps the scan when Steam fails and scans again on request', async () => {
  requirements.mockResolvedValue({ ok: false, message: 'Gioco non trovato su Steam.' })
  scan.mockResolvedValue(PC)
  open()
  await screen.findByText(/Gioco non trovato su Steam\./)
  const again = screen.getByRole('button', { name: /scansiona di nuovo/i })
  await vi.waitFor(() => expect((again as HTMLButtonElement).disabled).toBe(false))
  fireEvent.click(again)
  await vi.waitFor(() => expect(scan).toHaveBeenCalledTimes(2))
})
