import { useEffect, useMemo, useState, type JSX } from 'react'
import { Alert, Button, CssBaseline, Snackbar, ThemeProvider, createTheme } from '@mui/material'
import { AuthPage } from './Login'
import { Library } from './library'
import { PostRegistrazione } from './post-registrazione'
import { Icon } from './components/Icon'
import { getSession, signOut, type AuthMode, type Profile } from './auth'
import { STEAM_GAMES } from './games'
import './styles.css'

type Page = 'libreria' | 'preferiti' | 'pannello' | 'auth'
type Mode = 'dark' | 'light'

function readFavorites(profile: Profile | null): number[] {
  try {
    const stored = profile
      ? JSON.parse(localStorage.getItem(`bi.favorites.${profile.id}`) ?? '[]')
      : []
    return Array.isArray(stored)
      ? stored.filter((id) => STEAM_GAMES.some((game) => game.id === id))
      : []
  } catch {
    return []
  }
}

function readTheme(): Mode {
  try {
    return localStorage.getItem('theme') === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

export default function App(): JSX.Element {
  const [profile, setProfile] = useState<Profile | null>(getSession)
  const [page, setPage] = useState<Page>('libreria')
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [returnPage, setReturnPage] = useState<Page>('libreria')
  const [mode, setMode] = useState<Mode>(readTheme)
  const [notice, setNotice] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('Tutti i generi')
  const [searchTerm, setSearchTerm] = useState('')
  const [favorites, setFavorites] = useState<number[]>(() => readFavorites(profile))
  const theme = useMemo(
    () =>
      createTheme({
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
          button: { textTransform: 'none', fontWeight: 600 }
        },
        shape: { borderRadius: 6 },
        components: {
          MuiButton: {
            defaultProps: { disableElevation: true },
            styleOverrides: { root: { padding: '8px 16px' } }
          },
          MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
          MuiTextField: { defaultProps: { fullWidth: true } }
        }
      }),
    [mode]
  )

  useEffect(() => {
    document.documentElement.dataset.theme = mode
  }, [mode])
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [page])
  useEffect(() => {
    const checkSession = (): void => {
      if (profile && getSession()?.id !== profile.id) {
        setProfile(null)
        setFavorites([])
        setPage('libreria')
        setNotice('Sessione terminata. Accedi di nuovo al tuo profilo.')
      }
    }
    const timer = window.setInterval(checkSession, 30_000)
    window.addEventListener('focus', checkSession)
    window.addEventListener('storage', checkSession)
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', checkSession)
      window.removeEventListener('storage', checkSession)
    }
  }, [profile])

  const openAuth = (mode: AuthMode = 'login', destination: Page = 'libreria'): void => {
    setAuthMode(mode)
    setReturnPage(destination)
    setPage('auth')
  }
  const navigate = (target: Page): void => {
    if (!profile && (target === 'pannello' || target === 'preferiti')) {
      openAuth('login', target)
      return
    }
    setPage(target)
  }
  const toggleFavorite = (id: number): void => {
    if (!profile) {
      openAuth('register')
      return
    }
    const next = favorites.includes(id)
      ? favorites.filter((entry) => entry !== id)
      : [...favorites, id]
    try {
      localStorage.setItem(`bi.favorites.${profile.id}`, JSON.stringify(next))
      setFavorites(next)
    } catch {
      setNotice('Impossibile salvare i preferiti. Verifica lo spazio disponibile.')
    }
  }
  const toggleMode = (): void => {
    const next = mode === 'dark' ? 'light' : 'dark'
    setMode(next)
    try {
      localStorage.setItem('theme', next)
    } catch {
      /* Keep the theme for this view. */
    }
  }
  const logout = (): void => {
    try {
      signOut()
      setProfile(null)
      setFavorites([])
      setPage('libreria')
      setNotice('Hai effettuato l’uscita. I tuoi dati locali sono conservati.')
    } catch {
      setNotice('Impossibile terminare la sessione. Riprova.')
    }
  }
  const title =
    page === 'pannello'
      ? 'La mia build'
      : page === 'preferiti'
        ? 'I miei preferiti'
        : page === 'auth'
          ? 'Il tuo profilo'
          : 'Esplora'

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="app-shell">
        <aside className="sidebar" aria-label="Navigazione principale">
          <button
            className="brand"
            onClick={() => navigate('libreria')}
            aria-label="Build Inspector, vai al catalogo"
          >
            Build <span>Inspector</span>
          </button>
          <div className="sidebar-label">Menu</div>
          <nav>
            <button
              className={`nav-item ${page === 'libreria' ? 'active' : ''}`}
              aria-label="Esplora giochi"
              onClick={() => navigate('libreria')}
              aria-current={page === 'libreria' ? 'page' : undefined}
            >
              <Icon name="grid" />
              <span>Esplora giochi</span>
              <span className="nav-count">06</span>
            </button>
            <button
              className={`nav-item ${page === 'preferiti' ? 'active' : ''}`}
              aria-label="Preferiti"
              onClick={() => navigate('preferiti')}
              aria-current={page === 'preferiti' ? 'page' : undefined}
            >
              <Icon name="heart" />
              <span>Preferiti</span>
              {!!favorites.length && <span className="nav-count">{favorites.length}</span>}
            </button>
            <button
              className={`nav-item ${page === 'pannello' ? 'active' : ''}`}
              aria-label="La mia build"
              onClick={() => navigate('pannello')}
              aria-current={page === 'pannello' ? 'page' : undefined}
            >
              <Icon name="chip" />
              <span>La mia build</span>
              {!profile && <Icon name="lock" size={14} />}
            </button>
          </nav>
          <div className="sidebar-footer">
            <div className="profile-avatar">
              <Icon name={profile ? 'user' : 'game'} />
            </div>
            <div className="profile-info">
              <strong>{profile?.name ?? 'Modalità ospite'}</strong>
              <small>{profile ? 'Profilo locale' : 'Accesso non effettuato'}</small>
            </div>
            {profile && (
              <button
                className="icon-button"
                onClick={logout}
                aria-label="Esci dal profilo"
                title="Esci dal profilo"
              >
                <Icon name="logout" size={18} />
              </button>
            )}
          </div>
        </aside>
        <div className="workspace">
          <header className="topbar">
            <div className="breadcrumb">
              <strong>{title}</strong>
            </div>
            <div className="topbar-actions">
              <button
                className="icon-button theme-button"
                onClick={toggleMode}
                aria-label={`Attiva tema ${mode === 'dark' ? 'chiaro' : 'scuro'}`}
                title={`Tema ${mode === 'dark' ? 'chiaro' : 'scuro'}`}
              >
                <Icon name={mode === 'dark' ? 'sun' : 'moon'} size={19} />
              </button>
              {!profile && page !== 'auth' && (
                <>
                  <Button color="inherit" onClick={() => openAuth('login')}>
                    Accedi
                  </Button>
                  <Button variant="contained" onClick={() => openAuth('register')}>
                    Registrati
                  </Button>
                </>
              )}
              {profile && (
                <span className="session-indicator">
                  <span />
                  Ciao, {profile.name}
                </span>
              )}
            </div>
          </header>
          <main className="content" id="main-content">
            {page === 'auth' && !profile ? (
              <AuthPage
                key={authMode}
                initialMode={authMode}
                onLoginSuccess={(user) => {
                  setProfile(user)
                  setFavorites(readFavorites(user))
                  setPage(returnPage)
                  setNotice(`Benvenuto, ${user.name}. Accesso effettuato.`)
                }}
                onCancel={() => setPage('libreria')}
              />
            ) : page === 'pannello' && profile ? (
              <PostRegistrazione key={profile.id} games={STEAM_GAMES} profileId={profile.id} />
            ) : (
              <Library
                games={STEAM_GAMES}
                favorites={favorites}
                favoritesOnly={page === 'preferiti'}
                selectedGenre={selectedGenre}
                onSelectGenre={setSelectedGenre}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                profile={profile}
                onToggleFavorite={toggleFavorite}
                onOpenBuild={() => navigate('pannello')}
                onOpenAuth={() => openAuth('register', 'pannello')}
              />
            )}
          </main>
        </div>
      </div>
      <Snackbar
        open={!!notice}
        autoHideDuration={5500}
        onClose={() => setNotice('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="info" onClose={() => setNotice('')} variant="filled">
          {notice}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  )
}
