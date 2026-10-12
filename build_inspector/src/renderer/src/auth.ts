// Local profiles only. Browser storage is not a server-side authorization boundary.
// Replace this adapter with an authenticated backend before offering online accounts.
export interface Profile {
  id: string
  name: string
  email: string
}

interface StoredProfile extends Profile {
  salt: string
  verifier: string
}

export type AuthMode = 'login' | 'register'
export type AuthFields = 'name' | 'email' | 'password' | 'confirmPassword'
export type FieldErrors = Partial<Record<AuthFields, string>>

const ACCOUNTS_KEY = 'build-inspector.accounts.v1'
const SESSION_KEY = 'build-inspector.session.v1'
const ITERATIONS = 600_000
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateCredentials(
  mode: AuthMode,
  values: { name: string; email: string; password: string; confirmPassword: string }
): FieldErrors {
  const errors: FieldErrors = {}
  if (mode === 'register' && (values.name.trim().length < 2 || values.name.trim().length > 30)) {
    errors.name = 'Scegli un nome da 2 a 30 caratteri.'
  }
  if (!EMAIL_PATTERN.test(values.email.trim()) || values.email.trim().length > 254) {
    errors.email = 'Inserisci un indirizzo email valido.'
  }
  if (!values.password) errors.password = 'Inserisci la password.'
  else if (values.password.length > 128) errors.password = 'Usa al massimo 128 caratteri.'
  else if (mode === 'register' && values.password.length < 12) {
    errors.password = 'Usa almeno 12 caratteri, anche una frase facile da ricordare.'
  }
  if (mode === 'register' && values.password !== values.confirmPassword) {
    errors.confirmPassword = 'Le password non coincidono.'
  }
  return errors
}

function readAccounts(): StoredProfile[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY)
    if (!raw) return []
    const accounts: unknown = JSON.parse(raw)
    if (
      !Array.isArray(accounts) ||
      !accounts.every(
        (entry) =>
          entry &&
          typeof entry.id === 'string' &&
          typeof entry.name === 'string' &&
          typeof entry.email === 'string' &&
          typeof entry.salt === 'string' &&
          /^[a-f0-9]{32}$/.test(entry.salt) &&
          typeof entry.verifier === 'string' &&
          /^[a-f0-9]{64}$/.test(entry.verifier)
      )
    )
      throw new Error('Invalid local accounts')
    return accounts
  } catch {
    throw new Error(
      'Non riesco a leggere i profili locali. I dati esistenti non sono stati modificati.'
    )
  }
}

function hex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function deriveVerifier(password: string, salt: string): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error(
      'La protezione delle password non è disponibile. Apri la versione desktop dell’app.'
    )
  }
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const bytes = Uint8Array.from(salt.match(/.{2}/g) ?? [], (part) => parseInt(part, 16))
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: bytes, iterations: ITERATIONS, hash: 'SHA-256' },
    key,
    256
  )
  return hex(new Uint8Array(bits))
}

function publicProfile(account: StoredProfile): Profile {
  return { id: account.id, name: account.name, email: account.email }
}

function startSession(account: StoredProfile, remember: boolean): Profile {
  try {
    const storage = remember ? localStorage : sessionStorage
    const expiresAt = Date.now() + (remember ? 7 * 24 : 12) * 60 * 60 * 1000
    // Clear both stores so a previous remembered account cannot reappear on restart.
    signOut()
    storage.setItem(SESSION_KEY, JSON.stringify({ id: account.id, expiresAt }))
    return publicProfile(account)
  } catch {
    throw new Error(
      'Non riesco a salvare la sessione. Verifica lo spazio disponibile e riprova ad accedere.'
    )
  }
}

export async function register(
  name: string,
  email: string,
  password: string,
  remember: boolean
): Promise<Profile> {
  const errors = validateCredentials('register', {
    name,
    email,
    password,
    confirmPassword: password
  })
  if (Object.keys(errors).length) throw new Error(Object.values(errors)[0])
  const normalizedEmail = email.trim().toLowerCase()
  if (readAccounts().some((account) => account.email === normalizedEmail)) {
    throw new Error('Esiste già un profilo locale con questa email. Passa ad Accedi.')
  }
  const salt = hex(crypto.getRandomValues(new Uint8Array(16)))
  const verifier = await deriveVerifier(password, salt)
  const account = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: normalizedEmail,
    salt,
    verifier
  }
  // Re-read after derivation to preserve accounts created while the operation was pending.
  const accounts = readAccounts()
  if (accounts.some((entry) => entry.email === normalizedEmail)) {
    throw new Error('Esiste già un profilo locale con questa email. Passa ad Accedi.')
  }
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([...accounts, account]))
  } catch {
    throw new Error(
      'Profilo non salvato. Verifica lo spazio disponibile sul dispositivo e riprova.'
    )
  }
  return startSession(account, remember)
}

export async function signIn(email: string, password: string, remember: boolean): Promise<Profile> {
  const account = readAccounts().find((entry) => entry.email === email.trim().toLowerCase())
  const verifier = await deriveVerifier(password, account?.salt ?? '0'.repeat(32))
  if (!account || verifier !== account.verifier) {
    throw new Error('Email o password non corrette. Usa un profilo creato su questo dispositivo.')
  }
  return startSession(account, remember)
}

export function getSession(): Profile | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY) ?? localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw)
    if (typeof session.expiresAt !== 'number' || session.expiresAt <= Date.now()) {
      signOut()
      return null
    }
    const account = readAccounts().find((entry) => entry.id === session.id)
    if (!account) {
      signOut()
      return null
    }
    return publicProfile(account)
  } catch {
    return null
  }
}

export function signOut(): void {
  localStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(SESSION_KEY)
}
