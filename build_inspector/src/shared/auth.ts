export type Result<T> = { ok: true; data: T } | { ok: false; message: string }

export interface User {
  id: string
  name: string
  email: string
}

export interface SignInRequest {
  email: string
  password: string
}

export interface SignUpRequest extends SignInRequest {
  name: string
}

// Solo questi dati attraversano il ponte tra Electron e React. I token non ne fanno parte.
export interface AccountApi {
  getSession(): Promise<Result<User | null>>
  signIn(values: SignInRequest): Promise<Result<User>>
  signUp(values: SignUpRequest): Promise<Result<{ message: string }>>
  signOut(): Promise<Result<null>>
  // Opens Google's sign-in page in the browser and waits for the user to finish there.
  signInWithGoogle(): Promise<Result<User>>
  // Stops waiting for a browser sign-in (the user closed the page, or changed their mind).
  cancelBrowserSignIn(): Promise<Result<null>>
}

export const accountChannels = {
  getSession: 'account:session',
  signIn: 'account:login',
  signUp: 'account:register',
  signOut: 'account:logout',
  signInWithGoogle: 'account:google',
  cancelBrowserSignIn: 'account:cancel-browser'
} as const
