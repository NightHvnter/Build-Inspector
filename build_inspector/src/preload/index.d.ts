import { ElectronAPI } from '@electron-toolkit/preload'
import type { AccountApi } from '../shared/auth'
import type { HistoryApi } from '../shared/history'
import type { SteamApi } from './shared/types/steam'
import type { ScannerApi } from './shared/types/scan'
import type { HardwareApi } from './shared/types/hardware'

declare global {
  interface Window {
    electron: ElectronAPI
    api?: {
      account: AccountApi
      steam: SteamApi
      scanner?: ScannerApi
      hardware?: HardwareApi
      history?: HistoryApi
    }
  }
}
