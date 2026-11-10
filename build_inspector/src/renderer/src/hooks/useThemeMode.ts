import { useMemo, useState } from 'react'
import type { PaletteMode, Theme } from '@mui/material'
import { createAppTheme } from '../theme'

function readMode(): PaletteMode {
  try {
    return localStorage.getItem('theme') === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

export function useThemeMode(): { mode: PaletteMode; theme: Theme; toggleTheme: () => void } {
  const [mode, setMode] = useState<PaletteMode>(readMode)
  const theme = useMemo(() => createAppTheme(mode), [mode])
  const toggleTheme = (): void => {
    const next = mode === 'dark' ? 'light' : 'dark'
    setMode(next)
    try {
      localStorage.setItem('theme', next)
    } catch {
      /* Il tema resta utilizzabile anche senza salvataggio. */
    }
  }
  return { mode, theme, toggleTheme }
}
