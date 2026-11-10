// Gli errori attesi sono valori da mostrare nell'interfaccia, non eccezioni.
export type Result<T> = { ok: true; data: T } | { ok: false; message: string }

export async function safely<T>(operation: () => Promise<Result<T>>): Promise<Result<T>> {
  try {
    return await operation()
  } catch {
    return { ok: false, message: 'Servizio non raggiungibile. Riprova tra un momento.' }
  }
}
