export type Result<T> = { ok: true; data: T } | { ok: false; message: string }

export interface User {
  id: string
  name: string
  email: string | null // null for Steam accounts: Steam shares no email
}

export interface SignInRequest {
  email: string
  password: string
}

export interface SignUpRequest extends SignInRequest {
  name: string
}

// Accounts users can sign in with through their browser, and how the app names them.
export const LOGIN_PROVIDERS = { google: 'Google', discord: 'Discord', steam: 'Steam' } as const
export type LoginProvider = keyof typeof LOGIN_PROVIDERS

export function isLoginProvider(value: unknown): value is LoginProvider {
  return typeof value === 'string' && Object.hasOwn(LOGIN_PROVIDERS, value)
}

// Solo questi dati attraversano il ponte tra Electron e React. I token non ne fanno parte.
export interface AccountApi {
  getSession(): Promise<Result<User | null>>
  signIn(values: SignInRequest): Promise<Result<User>>
  signUp(values: SignUpRequest): Promise<Result<{ message: string }>>
  signOut(): Promise<Result<null>>
  // Opens the provider's sign-in page in the browser and waits for the user to finish there.
  signInWithProvider(provider: LoginProvider): Promise<Result<User>>
  // Stops waiting for a browser sign-in (the user closed the page, or changed their mind).
  cancelBrowserSignIn(): Promise<Result<null>>
}

export const accountChannels = {
  getSession: 'account:session',
  signIn: 'account:login',
  signUp: 'account:register',
  signOut: 'account:logout',
  signInWithProvider: 'account:provider',
  cancelBrowserSignIn: 'account:cancel-browser'
} as const
