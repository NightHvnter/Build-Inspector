import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { AuthMode, AuthValues, FieldErrors } from '../types/auth'
import { validateAuthForm } from '../utils/authValidation'
import { getAuthDestination } from '../utils/authNavigation'
import { useAuth } from './useAuth'
import { useLoading } from './useLoading'

interface Feedback {
  severity: 'error' | 'success'
  message: string
}
interface AuthFormState {
  values: AuthValues
  errors: FieldErrors
  feedback: Feedback | null
  busy: boolean
  change: <K extends keyof AuthValues>(field: K, value: AuthValues[K]) => void
  submit: (event: FormEvent<HTMLFormElement>) => Promise<void>
}

export function useAuthForm(mode: AuthMode): AuthFormState {
  const [values, setValues] = useState<AuthValues>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    remember: false
  })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const submitting = useRef(false)
  const active = useRef(true)
  const auth = useAuth()
  const { isLoading } = useLoading()
  const navigate = useNavigate()
  const { search } = useLocation()

  useEffect(() => {
    active.current = true
    return () => {
      active.current = false
    }
  }, [])

  const change = <K extends keyof AuthValues>(field: K, value: AuthValues[K]): void => {
    setValues((previous) => ({ ...previous, [field]: value }))
    setErrors((previous) => ({ ...previous, [field]: undefined }))
    setFeedback(null)
  }

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    if (submitting.current || isLoading) return
    const validation = validateAuthForm(mode, values)
    setErrors(validation)
    if (Object.keys(validation).length) {
      event.currentTarget
        .querySelector<HTMLInputElement>('input[name="' + Object.keys(validation)[0] + '"]')
        ?.focus()
      return
    }
    submitting.current = true
    setFeedback(null)
    try {
      const email = values.email.trim()
      if (mode === 'login') {
        const result = await auth.signIn({
          email,
          password: values.password,
          remember: values.remember
        })
        if (!active.current) return
        if (result.ok) {
          navigate(getAuthDestination(search), { replace: true })
          return
        }
        setFeedback({ severity: 'error', message: result.message })
      } else {
        const result =
          mode === 'register'
            ? await auth.signUp({ name: values.name.trim(), email, password: values.password })
            : await auth.recoverPassword(email)
        if (!active.current) return
        setFeedback({
          severity: result.ok ? 'success' : 'error',
          message: result.ok ? result.data.message : result.message
        })
      }
      if (active.current)
        setValues((previous) => ({ ...previous, password: '', confirmPassword: '' }))
    } finally {
      submitting.current = false
    }
  }
  return { values, errors, feedback, busy: isLoading, change, submit }
}
