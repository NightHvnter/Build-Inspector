import { ipcMain } from 'electron'
import { IPC } from '@shared/types/ipc'
import type { ScannedPc } from '@shared/types'
import { scanPc } from '../scanner/scanPc'
import { saveMyPc, loadMyPc } from '../storage/myPc'
import { addToHistory, listHistory, exportScan, importScan } from '../storage/history'
import {
  getGameMinimumRequirements,
  getGamesDetails,
  getTopGames,
  getTopGenres,
  searchSteamGames
} from '../steam/steamcalls'
import { MAX_DETAILS_IDS, MAX_GENRE_LENGTH } from '@shared/types/steam'
import { isAppId } from '../../shared/favorites'
import { getHardwareCatalog } from '../hardware/hardwareCalls'

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
  ipcMain.handle(IPC.steamTop, (_e, genre: unknown) => {
    if (genre === undefined || genre === null || genre === '') return getTopGames()
    return typeof genre === 'string' && genre.trim() && genre.length <= MAX_GENRE_LENGTH
      ? getTopGames(genre.trim())
      : { ok: false, message: 'Genere non valido.' }
  })
  ipcMain.handle(IPC.steamTopGenres, () => getTopGenres())
  ipcMain.handle(IPC.steamDetails, (_e, appIds: unknown) =>
    Array.isArray(appIds) && appIds.length <= MAX_DETAILS_IDS && appIds.every(isAppId)
      ? getGamesDetails(appIds)
      : { ok: false, message: 'Giochi non validi.' }
  )
  ipcMain.handle(IPC.steamRequirements, (_e, appId: unknown) =>
    typeof appId === 'number' && Number.isSafeInteger(appId) && appId > 0
      ? getGameMinimumRequirements(appId)
      : { ok: false, message: 'Gioco non valido.' }
  )
  ipcMain.handle(IPC.hardwareCatalog, () => getHardwareCatalog())
}
