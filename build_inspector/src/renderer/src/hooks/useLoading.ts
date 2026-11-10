import { useContext } from 'react'
import { LoadingContext, type LoadingContextValue } from '../contexts/LoadingContext'

export function useLoading(): LoadingContextValue {
  return useContext(LoadingContext)
}
