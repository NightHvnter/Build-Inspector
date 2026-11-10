import { ipcMain, type IpcMainInvokeEvent } from 'electron'
import { accountChannels, type SignInRequest, type SignUpRequest } from '../shared/auth'
import { createAccountClient } from '../preload/auth/auth'

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
}
