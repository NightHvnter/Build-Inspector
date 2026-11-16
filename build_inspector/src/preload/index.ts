import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

import { accountChannels, type AccountApi } from '../shared/auth'
import { historyChannels, type HistoryApi } from '../shared/history'
import { IPC } from '@shared/types/ipc'
import type { SteamApi } from '@shared/types/steam'
import type { ScannerApi } from '@shared/types/scan'
import type { HardwareApi } from '@shared/types/hardware'

const account: AccountApi = {
  getSession: () => ipcRenderer.invoke(accountChannels.getSession),
  signIn: (values) => ipcRenderer.invoke(accountChannels.signIn, values),
  signUp: (values) => ipcRenderer.invoke(accountChannels.signUp, values),
  signOut: () => ipcRenderer.invoke(accountChannels.signOut)
}
const steam: SteamApi = {
  search: (term) => ipcRenderer.invoke(IPC.steamSearch, term),
  requirements: (appId) => ipcRenderer.invoke(IPC.steamRequirements, appId)
}
const scanner: ScannerApi = {
  scan: () => ipcRenderer.invoke(IPC.scan)
}
const hardware: HardwareApi = {
  catalog: () => ipcRenderer.invoke(IPC.hardwareCatalog)
}
const history: HistoryApi = {
  list: () => ipcRenderer.invoke(historyChannels.list),
  record: (entry) => ipcRenderer.invoke(historyChannels.record, entry),
  remove: (id) => ipcRenderer.invoke(historyChannels.remove, id),
  clear: () => ipcRenderer.invoke(historyChannels.clear)
}
const api = { account, steam, scanner, hardware, history }

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
