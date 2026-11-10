import type { JSX } from 'react'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { HashRouter } from 'react-router-dom'
import { AppRoutes } from './AppRoutes'
import { useThemeMode } from './hooks/useThemeMode'
import { AuthProvider } from './providers/AuthProvider'
import { LoadingProvider } from './providers/LoadingProvider'
import { LoadingOverlay } from './components/common/LoadingOverlay'

export default function App(): JSX.Element {
  const { mode, theme, toggleTheme } = useThemeMode()
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LoadingProvider>
        <AuthProvider>
          <HashRouter>
            <AppRoutes mode={mode} toggleTheme={toggleTheme} />
          </HashRouter>
          <LoadingOverlay />
        </AuthProvider>
      </LoadingProvider>
    </ThemeProvider>
  )
}
