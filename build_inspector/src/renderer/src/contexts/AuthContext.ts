import { createContext } from 'react'
import type { AuthService } from '../services/authService'
import { authService } from '../services/authService'
import type { User } from '../types/auth'

export interface AuthContextValue {
  user: User | null
  initializing: boolean
  configured: boolean
  sessionError: string
  signIn: AuthService['signIn']
  signUp: AuthService['signUp']
  signOut: AuthService['signOut']
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  initializing: false,
  configured: false,
  sessionError: '',
  signIn: authService.signIn,
  signUp: authService.signUp,
  signOut: authService.signOut
})
