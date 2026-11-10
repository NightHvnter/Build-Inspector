import { createTheme, type PaletteMode, type Theme } from '@mui/material'

export function createAppTheme(mode: PaletteMode): Theme {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'dark' ? '#f08b9e' : '#c52f50',
        contrastText: mode === 'dark' ? '#202126' : '#fff'
      },
      background: {
        default: mode === 'dark' ? '#202126' : '#f5f5f5',
        paper: mode === 'dark' ? '#292b31' : '#fff'
      },
      text: {
        primary: mode === 'dark' ? '#f0f0f2' : '#25262b',
        secondary: mode === 'dark' ? '#b2b3bc' : '#666870'
      },
      divider: mode === 'dark' ? '#404149' : '#dedee3'
    },
    typography: {
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      h4: { fontSize: 28, fontWeight: 600 },
      h5: { fontSize: 22, fontWeight: 600 },
      h6: { fontSize: 18, fontWeight: 600 },
      button: { textTransform: 'none', fontWeight: 600 }
    },
    shape: { borderRadius: 6 },
    components: {
      MuiButton: { defaultProps: { disableElevation: true } },
      MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
      MuiTextField: { defaultProps: { fullWidth: true } },
      MuiCssBaseline: { styleOverrides: { body: { margin: 0 }, '#root': { minHeight: '100vh' } } }
    }
  })
}
