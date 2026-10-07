import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IPC } from '@shared/types/ipc'
import type { ScannedPc } from '@shared/types'

const api = {
  scanPc: (): Promise<ScannedPc> => ipcRenderer.invoke(IPC.scan),
  saveMyPc: (scan: ScannedPc): Promise<void> => ipcRenderer.invoke(IPC.saveMyPc, scan),
  loadMyPc: (): Promise<ScannedPc | null> => ipcRenderer.invoke(IPC.loadMyPc),
  listHistory: (): Promise<ScannedPc[]> => ipcRenderer.invoke(IPC.listHistory),
  exportScan: (scan: ScannedPc): Promise<boolean> => ipcRenderer.invoke(IPC.exportScan, scan),
  importScan: (): Promise<ScannedPc | null> => ipcRenderer.invoke(IPC.importScan)
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (defined in index.d.ts)
  window.electron = electronAPI
  // @ts-ignore (defined in index.d.ts)
  window.api = api
}

export type Api = typeof api