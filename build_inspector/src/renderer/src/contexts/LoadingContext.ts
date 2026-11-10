import { createContext } from 'react'
import { safely, type Result } from '../services/result'

export interface LoadingContextValue {
  isLoading: boolean
  message: string
  runWithLoading: <T>(operation: () => Promise<Result<T>>, message?: string) => Promise<Result<T>>
}

export const LoadingContext = createContext<LoadingContextValue>({
  isLoading: false,
  message: '',
  runWithLoading: safely
})
