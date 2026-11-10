import { ElectronAPI } from '@electron-toolkit/preload'
import type { AccountApi } from '../shared/auth'

declare global {
  interface Window {
    electron: ElectronAPI
    api?: { account: AccountApi }
  }
}
