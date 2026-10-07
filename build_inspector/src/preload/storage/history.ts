
import { app, dialog } from 'electron'
import { join } from 'path'
import { mkdir, readdir, readFile, rm, writeFile } from 'fs/promises'
import type { ScannedPc } from '@shared/types'

const MAX_SCANS = 10
const dir = (): string => join(app.getPath('userData'), 'scans')

export async function addToHistory(scan: ScannedPc): Promise<void> {
  await mkdir(dir(), { recursive: true })
  const name = `${scan.scannedAt.replace(/[:.]/g, '-')}.json`
  await writeFile(join(dir(), name), JSON.stringify(scan, null, 2), 'utf8')

  const files = (await readdir(dir())).filter((f) => f.endsWith('.json')).sort()
  for (const old of files.slice(0, Math.max(0, files.length - MAX_SCANS))) {
    await rm(join(dir(), old), { force: true })
  }
}


export async function listHistory(): Promise<ScannedPc[]> {
  try {
    const files = (await readdir(dir())).filter((f) => f.endsWith('.json')).sort().reverse()
    return await Promise.all(
      files.map(async (f) => JSON.parse(await readFile(join(dir(), f), 'utf8')) as ScannedPc)
    )
  } catch {
    return []
  }
}

export async function exportScan(scan: ScannedPc): Promise<boolean> {
  const { canceled, filePath } = await dialog.showSaveDialog({
    defaultPath: 'my-pc.json',
    filters: [{ name: 'JSON', extensions: ['json'] }]
  })
  if (canceled || !filePath) return false
  await writeFile(filePath, JSON.stringify(scan, null, 2), 'utf8')
  return true
}

export async function importScan(): Promise<ScannedPc | null> {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'JSON', extensions: ['json'] }]
  })
  if (canceled || !filePaths[0]) return null
  const data = JSON.parse(await readFile(filePaths[0], 'utf8'))
  const valid = data && data.cpu && Array.isArray(data.gpus) && data.ram && Array.isArray(data.ram.modules)
  if (!valid) throw new Error('This file is not a valid Build Inspector scan')
  return data as ScannedPc
}