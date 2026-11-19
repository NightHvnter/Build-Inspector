import { BrowserWindow, ipcMain, shell, type IpcMainInvokeEvent } from 'electron'
import {
  accountChannels,
  isLoginProvider,
  type SignInRequest,
  type SignUpRequest
} from '../shared/auth'
import { createAccountClient } from '../preload/auth/auth'
import { historyChannels, isHistoryRecord, toHistoryEntry } from '../shared/history'
import { favoritesChannels, isAppId, isAppIdList } from '../shared/favorites'

export function registerAccountIpc(rendererUrl: string): void {
  const client = createAccountClient(undefined, { openBrowser: (url) => shell.openExternal(url) })
  const trustedPage = new URL(rendererUrl)
  function trusted(event: IpcMainInvokeEvent): boolean {
    const frame = event.senderFrame
    if (!frame || frame !== event.sender.mainFrame || !URL.canParse(frame.url)) return false
    const page = new URL(frame.url)
    return (
      page.protocol === trustedPage.protocol &&
      page.host === trustedPage.host &&
      page.pathname === trustedPage.pathname
    )
  }
  const refused = { ok: false, message: 'Richiesta account non valida.' }
  const validLogin = (values?: SignInRequest): boolean =>
    typeof values?.email === 'string' && typeof values?.password === 'string'
  ipcMain.handle(accountChannels.getSession, (event) =>
    trusted(event) ? client.getSession() : refused
  )
  ipcMain.handle(accountChannels.signIn, (event, values: SignInRequest) =>
    trusted(event) && validLogin(values) ? client.signIn(values) : refused
  )
  ipcMain.handle(accountChannels.signUp, (event, values: SignUpRequest) =>
    trusted(event) && validLogin(values) && typeof values?.name === 'string'
      ? client.signUp(values)
      : refused
  )
  ipcMain.handle(accountChannels.signOut, (event) => (trusted(event) ? client.signOut() : refused))
  ipcMain.handle(accountChannels.signInWithProvider, async (event, provider: unknown) => {
    if (!trusted(event) || !isLoginProvider(provider)) return refused
    const result = await client.signInWithProvider(provider)
    // The user was in the browser: bring the app back in front.
    const window = BrowserWindow.fromWebContents(event.sender)
    if (window && !window.isDestroyed()) {
      if (window.isMinimized()) window.restore()
      window.focus()
    }
    return result
  })
  ipcMain.handle(accountChannels.cancelBrowserSignIn, (event) =>
    trusted(event) ? client.cancelBrowserSignIn() : refused
  )

  // Comparison history: requests go out with the user's tokens, which stay in this process.
  ipcMain.handle(historyChannels.list, async (event) => {
    if (!trusted(event)) return refused
    const reply = await client.authorized('GET', '/history')
    if (!reply.ok) return reply
    const rows = Array.isArray(reply.data) ? reply.data : []
    return { ok: true, data: rows.map(toHistoryEntry).filter((entry) => entry !== null) }
  })
  ipcMain.handle(historyChannels.record, async (event, entry: unknown) => {
    if (!trusted(event) || !isHistoryRecord(entry)) return refused
    const reply = await client.authorized('POST', '/history', {
      AppId: entry.appId,
      GameName: entry.gameName,
      CpuName: entry.cpuName,
      GpuName: entry.gpuName,
      RamGb: entry.ramGb,
      Met: entry.met,
      Failed: entry.failed,
      ToCheck: entry.toCheck
    })
    if (!reply.ok) return reply
    const saved = toHistoryEntry(reply.data)
    return saved ? { ok: true, data: saved } : refused
  })
  ipcMain.handle(historyChannels.remove, async (event, id: unknown) => {
    if (!trusted(event) || !Number.isSafeInteger(id) || (id as number) <= 0) return refused
    const reply = await client.authorized('DELETE', '/history/' + id)
    return reply.ok ? { ok: true, data: null } : reply
  })
  ipcMain.handle(historyChannels.clear, async (event) => {
    if (!trusted(event)) return refused
    const reply = await client.authorized('DELETE', '/history')
    return reply.ok ? { ok: true, data: null } : reply
  })

  // Favourite games: every route replies with the whole list of app ids.
  const favoritesReply = (reply: { ok: boolean; data?: unknown }): unknown => {
    if (!reply.ok) return reply
    return isAppIdList(reply.data) ? { ok: true, data: reply.data } : refused
  }
  ipcMain.handle(favoritesChannels.list, async (event) => {
    if (!trusted(event)) return refused
    return favoritesReply(await client.authorized('GET', '/favorites'))
  })
  ipcMain.handle(favoritesChannels.add, async (event, appIds: unknown) => {
    if (!trusted(event) || !isAppIdList(appIds) || !appIds.length) return refused
    return favoritesReply(await client.authorized('POST', '/favorites', { AppIds: appIds }))
  })
  ipcMain.handle(favoritesChannels.remove, async (event, appId: unknown) => {
    if (!trusted(event) || !isAppId(appId)) return refused
    return favoritesReply(await client.authorized('DELETE', '/favorites/' + appId))
  })
}
