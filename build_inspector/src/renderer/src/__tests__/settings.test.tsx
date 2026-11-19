import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { normalizeServerUrl } from '../../../shared/server'
import { SettingsPage } from '../settings'

const get = vi.fn()
const test = vi.fn()
const save = vi.fn()

beforeEach(() => {
  window.api = { account: {} as never, steam: {} as never, server: { get, test, save } }
  get.mockResolvedValue({
    url: 'http://localhost:3636',
    source: 'default',
    defaultUrl: 'http://localhost:3636'
  })
  test.mockResolvedValue({ ok: true, data: null })
  save.mockResolvedValue({ ok: true, data: null })
})

afterEach(() => {
  cleanup()
  delete window.api
  vi.clearAllMocks()
})

it('accepts https anywhere and http only on this computer', () => {
  expect(normalizeServerUrl(' https://abc.trycloudflare.com/ ')).toBe(
    'https://abc.trycloudflare.com'
  )
  expect(normalizeServerUrl('http://localhost:3636')).toBe('http://localhost:3636')
  expect(normalizeServerUrl('http://127.0.0.1:3636/api/')).toBe('http://127.0.0.1:3636/api')
  for (const bad of [
    'http://192.168.1.5:3636',
    'ftp://example.com',
    'https://user:pass@example.com',
    'https://example.com/?x=1',
    'not a url',
    42
  ])
    expect(normalizeServerUrl(bad)).toBeNull()
})

it('tests and saves a new server address', async () => {
  render(<SettingsPage />)
  const field = await screen.findByDisplayValue('http://localhost:3636')
  const saveButton = screen.getByRole('button', { name: 'Salva e riavvia' })
  // Nothing to save until the address changes.
  expect(saveButton.hasAttribute('disabled')).toBe(true)

  fireEvent.change(field, { target: { value: 'https://abc.trycloudflare.com/' } })
  fireEvent.click(screen.getByRole('button', { name: 'Verifica' }))
  await screen.findByText('Il server risponde correttamente.')
  expect(test).toHaveBeenCalledWith('https://abc.trycloudflare.com')

  fireEvent.click(saveButton)
  await waitFor(() => expect(save).toHaveBeenCalledWith('https://abc.trycloudflare.com'))
  await screen.findByText(/l’app si sta riavviando/)
})

it('refuses plain http to another computer', async () => {
  render(<SettingsPage />)
  const field = await screen.findByDisplayValue('http://localhost:3636')
  fireEvent.change(field, { target: { value: 'http://192.168.1.5:3636' } })
  screen.getByText('Usa un indirizzo https://… (http solo per localhost).')
  expect(screen.getByRole('button', { name: 'Verifica' }).hasAttribute('disabled')).toBe(true)
})
