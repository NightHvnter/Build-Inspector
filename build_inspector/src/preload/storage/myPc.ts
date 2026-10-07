import { app } from 'electron'
import { join } from 'path'
import { mkdir, readFile, writeFile } from 'fs/promises'
import type { ScannedPc } from '@shared/types'

const filePath = (): string => join(app.getPath('userData'), 'my-pc.json')

export async function saveMyPc(scan: ScannedPc): Promise<void> {
  await mkdir(app.getPath('userData'), { recursive: true })
  await writeFile(filePath(), JSON.stringify(scan, null, 2), 'utf8')
}

export async function loadMyPc(): Promise<ScannedPc | null> {
  try {
    return JSON.parse(await readFile(filePath(), 'utf8')) as ScannedPc
  } catch {
    return null // no scan saved yet
  }
}