import { ipcMain, type IpcMainInvokeEvent } from 'electron'
import { accountChannels, type SignInRequest, type SignUpRequest } from '../shared/auth'
import { createAccountClient } from '../preload/auth/auth'
import { historyChannels, isHistoryRecord, toHistoryEntry } from '../shared/history'

export function registerAccountIpc(rendererUrl: string): void {
  const client = createAccountClient()
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
}
