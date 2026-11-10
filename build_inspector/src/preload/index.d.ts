import { ElectronAPI } from '@electron-toolkit/preload'
import type { AccountApi } from '../shared/auth'
import type { SteamApi } from './shared/types/steam'

declare global {
  interface Window {
    electron: ElectronAPI
    api?: { account: AccountApi; steam: SteamApi }
  }
}
