import { useRef, useState, type FormEvent, type JSX } from 'react'
import {
  Alert,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
  InputAdornment,
  TextField
} from '@mui/material'
import {
  register,
  signIn,
  validateCredentials,
  type AuthMode,
  type FieldErrors,
  type Profile
} from './auth'
import { Icon } from './components/Icon'

interface AuthPageProps {
  initialMode: AuthMode
  onLoginSuccess: (profile: Profile) => void
  onCancel: () => void
}

export function AuthPage({ initialMode, onLoginSuccess, onCancel }: AuthPageProps): JSX.Element {
  const [mode, setMode] = useState(initialMode)
  const [values, setValues] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [busy, setBusy] = useState(false)
  const [help, setHelp] = useState(false)
  const submitting = useRef(false)
  const isRegister = mode === 'register'
  const passwordReady = values.password.length >= 12
  const change = (field: keyof typeof values, value: string): void => {
    setValues((previous) => ({ ...previous, [field]: value }))
    setErrors((previous) => ({ ...previous, [field]: undefined }))
    setError('')
  }
  const switchMode = (next: AuthMode): void => {
    setMode(next)
    setValues((previous) => ({ ...previous, password: '', confirmPassword: '' }))
    setErrors({})
    setError('')
    setHelp(false)
    setShowPassword(false)
  }
  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    if (submitting.current) return
    const fieldErrors = validateCredentials(mode, values)
    setErrors(fieldErrors)
    if (Object.keys(fieldErrors).length) {
      const firstField = Object.keys(fieldErrors)[0]
      event.currentTarget.querySelector<HTMLInputElement>(`input[name="${firstField}"]`)?.focus()
      return
    }
    submitting.current = true
    setBusy(true)
    setError('')
    try {
      const user = isRegister
        ? await register(values.name, values.email, values.password, remember)
        : await signIn(values.email, values.password, remember)
      onLoginSuccess(user)
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Operazione non riuscita. Riprova tra un momento.'
      )
    } finally {
      submitting.current = false
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <button className="text-action back-link" disabled={busy} onClick={onCancel}>
        <Icon name="back" size={17} />
        Torna alla libreria
      </button>
      <div className="auth-layout">
        <section className="auth-card" aria-labelledby="auth-title">
          <div className="auth-tabs" aria-label="Scegli accesso o registrazione">
            <button
              type="button"
              className={!isRegister ? 'selected' : ''}
              aria-pressed={!isRegister}
              disabled={busy}
              onClick={() => switchMode('login')}
            >
              Accedi
            </button>
            <button
              type="button"
              className={isRegister ? 'selected' : ''}
              aria-pressed={isRegister}
              disabled={busy}
              onClick={() => switchMode('register')}
            >
              Registrati
            </button>
          </div>
          <h2 id="auth-title">{isRegister ? 'Registrazione' : 'Accedi'}</h2>
          <p className="auth-intro">
            {isRegister
              ? 'Inserisci i dati per creare un profilo su questo PC.'
              : 'Accedi al profilo salvato su questo dispositivo.'}
          </p>
          <form onSubmit={handleSubmit} noValidate aria-busy={busy}>
            <fieldset disabled={busy} className="auth-fields">
              {isRegister && (
                <TextField
                  id="auth-name"
                  name="name"
                  label="Nome utente"
                  autoComplete="nickname"
                  value={values.name}
                  onChange={(event) => change('name', event.target.value)}
                  error={!!errors.name}
                  helperText={errors.name}
                  required
                  slotProps={{ htmlInput: { maxLength: 30 } }}
                />
              )}
              <TextField
                id="auth-email"
                name="email"
                label="Indirizzo email"
                type="email"
                autoComplete="username"
                value={values.email}
                onChange={(event) => change('email', event.target.value)}
                error={!!errors.email}
                helperText={errors.email}
                required
                slotProps={{
                  htmlInput: { maxLength: 254, autoCapitalize: 'none', spellCheck: false }
                }}
              />
              <TextField
                id="auth-password"
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                value={values.password}
                onChange={(event) => change('password', event.target.value)}
                error={!!errors.password}
                helperText={errors.password}
                required
                slotProps={{
                  htmlInput: { maxLength: 128 },
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          type="button"
                          disabled={busy}
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
                          aria-pressed={showPassword}
                        >
                          <Icon name="eye" size={20} />
                        </IconButton>
                      </InputAdornment>
                    )
                  }
                }}
              />
              {isRegister && (
                <>
                  <div className={`password-hint ${passwordReady ? 'ready' : ''}`}>
                    <Icon name={passwordReady ? 'check' : 'info'} size={15} />
                    Almeno 12 caratteri. Puoi usare una frase.
                  </div>
                  <TextField
                    id="auth-confirm"
                    name="confirmPassword"
                    label="Conferma password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={values.confirmPassword}
                    onChange={(event) => change('confirmPassword', event.target.value)}
                    error={!!errors.confirmPassword}
                    helperText={errors.confirmPassword}
                    required
                    slotProps={{ htmlInput: { maxLength: 128 } }}
                  />
                </>
              )}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={remember}
                    onChange={(event) => setRemember(event.target.checked)}
                    size="small"
                  />
                }
                label={
                  <span className="remember-label">
                    Ricordami per 7 giorni su questo dispositivo
                  </span>
                }
              />
              {error && <Alert severity="error">{error}</Alert>}
              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={busy}
                endIcon={
                  busy ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <Icon name="arrow" size={18} />
                  )
                }
              >
                {busy ? 'Un momento…' : isRegister ? 'Registrati' : 'Accedi'}
              </Button>
            </fieldset>
          </form>
          {!isRegister && (
            <button
              className="text-action recovery-link"
              onClick={() => setHelp(!help)}
              aria-expanded={help}
            >
              Non riesci ad accedere?
            </button>
          )}
          {help && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Usa l’email e la password del profilo creato su questo PC. Il recupero via email non è
              disponibile per i profili locali. Se hai dimenticato la password, puoi creare un altro
              profilo con un’email diversa; i dati del precedente non verranno trasferiti.
            </Alert>
          )}
          <div className="local-note">
            <Icon name="monitor" size={17} />
            <p>
              Profilo solo su questo dispositivo. Nessuna email di verifica o sincronizzazione
              online. I dati restano nell’app; cancellandoli perderai il profilo.
            </p>
          </div>
          <p className="auth-switch">
            {isRegister ? 'Hai già un profilo?' : 'È la tua prima volta?'}{' '}
            <button disabled={busy} onClick={() => switchMode(isRegister ? 'login' : 'register')}>
              {isRegister ? 'Accedi' : 'Crea un profilo'}
            </button>
          </p>
        </section>
      </div>
    </div>
  )
}
