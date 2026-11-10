import { ipcMain } from 'electron'
import { IPC } from '@shared/types/ipc'
import type { ScannedPc } from '@shared/types'
import { scanPc } from '../scanner/scanPc'
import { saveMyPc, loadMyPc } from '../storage/myPc'
import { addToHistory, listHistory, exportScan, importScan } from '../storage/history'
import { searchSteamGames } from '../steam/steamcalls'

export function registerIpc(): void {
  ipcMain.handle(IPC.scan, () => scanPc())
  ipcMain.handle(IPC.saveMyPc, async (_e, scan: ScannedPc) => {
    await saveMyPc(scan)
    await addToHistory(scan)
  })
  ipcMain.handle(IPC.loadMyPc, () => loadMyPc())
  ipcMain.handle(IPC.listHistory, () => listHistory())
  ipcMain.handle(IPC.exportScan, (_e, scan: ScannedPc) => exportScan(scan))
  ipcMain.handle(IPC.importScan, () => importScan())
  ipcMain.handle(IPC.steamSearch, (_e, term: unknown) => {
    const q = typeof term === 'string' ? term.trim().slice(0, 100) : ''
    return q ? searchSteamGames(q) : { ok: true, data: [] }
  })
}