export interface User {
  id: string
  name: string
  email: string
}

export type AuthMode = 'login' | 'register' | 'recovery'

export interface AuthValues {
  name: string
  email: string
  password: string
  confirmPassword: string
  remember: boolean
}

export type FieldErrors = Partial<Record<keyof AuthValues, string>>

export interface SignInRequest {
  email: string
  password: string
  remember: boolean
}

export interface SignUpRequest {
  name: string
  email: string
  password: string
}
