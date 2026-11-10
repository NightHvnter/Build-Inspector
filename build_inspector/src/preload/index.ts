import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

import { accountChannels, type AccountApi } from '../shared/auth'

const account: AccountApi = {
  getSession: () => ipcRenderer.invoke(accountChannels.getSession),
  signIn: (values) => ipcRenderer.invoke(accountChannels.signIn, values),
  signUp: (values) => ipcRenderer.invoke(accountChannels.signUp, values),
  signOut: () => ipcRenderer.invoke(accountChannels.signOut)
}
const api = { account }

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
