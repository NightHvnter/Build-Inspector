import { ElectronAPI } from '@electron-toolkit/preload'
import type { AccountApi } from '../shared/auth'
import type { SteamApi } from './shared/types/steam'
import type { ScannerApi } from './shared/types/scan'

declare global {
  interface Window {
    electron: ElectronAPI
    api?: { account: AccountApi; steam: SteamApi; scanner?: ScannerApi }
  }
}
