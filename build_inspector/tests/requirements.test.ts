import { expect, it } from 'vitest'
import { parseRequirements, sizeInGb } from '../src/preload/steam/requirements'

// Shortened from Steam's real answer for Cyberpunk 2077 (app 1091500), l=italian.
const CYBERPUNK =
  '<strong>Minimi:</strong><br><ul class="bb_ul"><li>Richiede un processore e un sistema operativo a 64 bit<br></li>' +
  '<li><strong>Sistema operativo:</strong> 64-bit Windows 10<br></li>' +
  '<li><strong>Processore:</strong> Core i7-6700 or Ryzen 5 1600<br></li>' +
  '<li><strong>Memoria:</strong> 12 GB di RAM<br></li>' +
  '<li><strong>Scheda video:</strong> GeForce GTX 1060 6GB or Radeon RX 580 8GB<br></li>' +
  '<li><strong>DirectX:</strong> Versione 12<br></li>' +
  '<li><strong>Archiviazione:</strong> 70 GB di spazio disponibile</li></ul>'

it('turns Steam requirement HTML into labelled plain-text rows', () => {
  expect(parseRequirements(CYBERPUNK)).toEqual([
    { kind: 'other', label: '', value: 'Richiede un processore e un sistema operativo a 64 bit' },
    { kind: 'os', label: 'Sistema operativo', value: '64-bit Windows 10' },
    { kind: 'cpu', label: 'Processore', value: 'Core i7-6700 or Ryzen 5 1600' },
    { kind: 'ram', label: 'Memoria', value: '12 GB di RAM' },
    { kind: 'gpu', label: 'Scheda video', value: 'GeForce GTX 1060 6GB or Radeon RX 580 8GB' },
    { kind: 'directx', label: 'DirectX', value: 'Versione 12' },
    { kind: 'storage', label: 'Archiviazione', value: '70 GB di spazio disponibile' }
  ])
})

it('decodes entities and drops every tag, including scripts and links', () => {
  const rows = parseRequirements(
    '<ul><li><strong>Processore:</strong> Intel&reg; Core&trade; i5 &amp; <a href="x">AMD</a><script>x()</script></li></ul>'
  )
  expect(rows).toEqual([{ kind: 'cpu', label: 'Processore', value: 'Intel® Core™ i5 & AMDx()' }])
  expect(rows[0].value).not.toMatch(/[<>]/)
})

it('handles plain text, English labels and missing requirements', () => {
  expect(parseRequirements('<strong>Minimum:</strong> Any modern PC')).toEqual([
    { kind: 'other', label: '', value: 'Any modern PC' }
  ])
  expect(parseRequirements('<ul><li><strong>Memory:</strong> 4 GB RAM</li></ul>')[0].kind).toBe(
    'ram'
  )
  expect(parseRequirements(undefined)).toEqual([])
  expect(parseRequirements([])).toEqual([])
})

it('reads sizes in GB from requirement text', () => {
  expect(sizeInGb('8 GB di RAM')).toBe(8)
  expect(sizeInGb('4096 MB RAM')).toBe(4)
  expect(sizeInGb('1,5 TB')).toBe(1536)
  expect(sizeInGb('Dual core')).toBeNull()
})
