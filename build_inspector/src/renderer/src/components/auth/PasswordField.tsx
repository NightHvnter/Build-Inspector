import { useState, type JSX } from 'react'
import { IconButton, InputAdornment, TextField } from '@mui/material'
import { Icon } from '../Icon'

interface PasswordFieldProps {
  name: string
  label: string
  value: string
  error?: string
  hint?: string
  autoComplete: 'current-password' | 'new-password'
  disabled: boolean
  onChange: (value: string) => void
}

export function PasswordField({
  name,
  label,
  value,
  error,
  hint,
  autoComplete,
  disabled,
  onChange
}: PasswordFieldProps): JSX.Element {
  const [visible, setVisible] = useState(false)
  return (
    <TextField
      name={name}
      label={label}
      value={value}
      type={visible ? 'text' : 'password'}
      autoComplete={autoComplete}
      required
      disabled={disabled}
      error={!!error}
      helperText={error ?? hint}
      onChange={(event) => onChange(event.target.value)}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                disabled={disabled}
                onClick={() => setVisible(!visible)}
                aria-label={(visible ? 'Nascondi ' : 'Mostra ') + label.toLowerCase()}
                aria-pressed={visible}
                edge="end"
              >
                <Icon name="eye" />
              </IconButton>
            </InputAdornment>
          )
        }
      }}
    />
  )
}
