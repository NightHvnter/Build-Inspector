export type { SignInRequest, SignUpRequest, User } from '../../../shared/auth'

export type AuthMode = 'login' | 'register'

export interface AuthValues {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export type FieldErrors = Partial<Record<keyof AuthValues, string>>
