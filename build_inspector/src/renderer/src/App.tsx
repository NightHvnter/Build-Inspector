import React, { useMemo, useState } from 'react';
import {
  AppBar,
  Box,
  Button,
  Chip,
  CssBaseline,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  ListSubheader,
  ThemeProvider,
  Toolbar,
  Typography,
  createTheme
} from '@mui/material';
import { PreRegistrazione, Game } from './pre-registrazione';
import { PostRegistrazione } from './post-registrazione';
import { Library } from './library';
import { AuthPage } from './Login';

// --- DATI DEI GIOCHI STEAM ---
const STEAM_GAMES: Game[] = [
  {
    id: 1,
    title: 'Counter-Strike 2',
    image: 'https://cdn.akamai.steamstatic.com/steam/apps/730/header.jpg',
    genre: ['FPS', 'Azione', 'Competitivo'],
    description: 'Il più famoso sparatutto tattico al mondo.',
    reqCpu: 'Intel Core i5-750 / AMD FX-6300',
    reqGpu: 'NVIDIA GTX 1060 / AMD RX 580',
    reqRam: 8,
    baseFps: 180
  },
  {
    id: 2,
    title: 'Dota 2',
    image: 'https://cdn.akamai.steamstatic.com/steam/apps/570/header.jpg',
    genre: ['MOBA', 'Strategia', 'Multigiocatore'],
    description: 'Un capolavoro di strategicità profonda.',
    reqCpu: 'Dual core Intel / AMD a 2.8 GHz',
    reqGpu: 'NVIDIA GeForce 8600/9600GT',
    reqRam: 4,
    baseFps: 120
  },
  {
    id: 3,
    title: 'Cyberpunk 2077',
    image: 'https://cdn.akamai.steamstatic.com/steam/apps/1091500/header.jpg',
    genre: ['RPG', 'Open World', 'Cyberpunk'],
    description: 'Un RPG d\'azione a mondo aperto ambientato a Night City.',
    reqCpu: 'Intel Core i7-12700 / AMD Ryzen 7 7800X3D',
    reqGpu: 'NVIDIA RTX 3070 / AMD RX 6800 XT',
    reqRam: 16,
    baseFps: 65
  },
  {
    id: 4,
    title: 'Elden Ring',
    image: 'https://cdn.akamai.steamstatic.com/steam/apps/1245620/header.jpg',
    genre: ['Souls-like', 'RPG', 'Open World'],
    description: 'Esplora l\'Interregno e scopri i segreti dell\'Anello Anziano.',
    reqCpu: 'Intel Core i7-8700K / AMD Ryzen 5 3600X',
    reqGpu: 'NVIDIA GTX 1070 / AMD RX Vega 56',
    reqRam: 12,
    baseFps: 75
  },
  {
    id: 5,
    title: 'Baldur\'s Gate 3',
    image: 'https://cdn.akamai.steamstatic.com/steam/apps/1086940/header.jpg',
    genre: ['RPG', 'Turni', 'Scelte tattiche'],
    description: 'Un ricco RPG ambientato nell\'universo di Dungeons & Dragons.',
    reqCpu: 'Intel i7 8700k / AMD r5 3600',
    reqGpu: 'NVIDIA RTX 2060 Super',
    reqRam: 16,
    baseFps: 70
  },
  {
    id: 6,
    title: 'Helldivers 2',
    image: 'https://cdn.akamai.steamstatic.com/steam/apps/553850/header.jpg',
    genre: ['Azione', 'Co-op', 'Spara e Fuggi'],
    description: 'Lotta per la libertà in una galassia ostile.',
    reqCpu: 'Intel Core i7-9700K',
    reqGpu: 'NVIDIA RTX 2060',
    reqRam: 16,
    baseFps: 80
  }
];

const ALL_GENRES = ['Tutti i generi', ...Array.from(new Set(STEAM_GAMES.flatMap((g) => g.genre)))];

type Page = 'libreria' | 'pannello' | 'auth';
type Mode = 'dark' | 'light';

const SIDEBAR_WIDTH = 270;

export default function App(): React.JSX.Element {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [page, setPage] = useState<Page>('libreria');

  const [selectedGenre, setSelectedGenre] = useState<string>('Tutti i generi');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [mode, setMode] = useState<Mode>(
    () => (localStorage.getItem('theme') as Mode | null) ?? 'dark'
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: '#e0234e' },
          ...(mode === 'dark'
            ? { background: { default: '#16171a', paper: '#1c1d21' } }
            : { background: { default: '#ffffff', paper: '#f6f7f9' } })
        },
        shape: { borderRadius: 6 },
        typography: {
          fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif"
        }
      }),
    [mode]
  );

  const toggleMode = () => {
    const next: Mode = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    localStorage.setItem('theme', next);
  };

  const filteredGames = STEAM_GAMES.filter((game) => {
    const matchesGenre = selectedGenre === 'Tutti i generi' || game.genre.includes(selectedGenre);
    const matchesSearch = game.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesGenre && matchesSearch;
  });

  const openAuth = () => setPage('auth');

  const goTo = (target: Page) => {
    if (target === 'pannello' && !isLoggedIn) {
      openAuth();
      return;
    }
    setPage(target);
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setPage('libreria');
  };

  const logout = () => {
    setIsLoggedIn(false);
    setPage('libreria');
  };

  const renderContent = () => {
    if (page === 'auth' && !isLoggedIn) {
      return <AuthPage onLoginSuccess={handleLoginSuccess} onCancel={() => setPage('libreria')} />;
    }

    if (!isLoggedIn) {
      return (
        <PreRegistrazione
          games={filteredGames}
          allGenres={ALL_GENRES}
          selectedGenre={selectedGenre}
          onSelectGenre={setSelectedGenre}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onOpenAuth={openAuth}
        />
      );
    }

    if (page === 'pannello') {
      return <PostRegistrazione games={STEAM_GAMES} />;
    }

    return (
      <Library
        games={filteredGames}
        allGenres={ALL_GENRES}
        selectedGenre={selectedGenre}
        onSelectGenre={setSelectedGenre}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh' }}>
        <Drawer
          variant="permanent"
          sx={{
            width: SIDEBAR_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: SIDEBAR_WIDTH,
              boxSizing: 'border-box',
              bgcolor: 'background.paper'
            }
          }}
        >
          <Box
            sx={{ px: 3, py: 2.5, cursor: 'pointer' }}
            onClick={() => {
              setPage('libreria');
              setSelectedGenre('Tutti i generi');
              setSearchTerm('');
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Build
              <Box component="span" sx={{ color: 'primary.main' }}>
                Inspector
              </Box>
            </Typography>
          </Box>

          <List
            subheader={
              <ListSubheader sx={{ bgcolor: 'transparent', lineHeight: '32px' }}>
                INTRODUZIONE
              </ListSubheader>
            }
          >
            <ListItemButton selected={page === 'libreria'} onClick={() => goTo('libreria')}>
              <ListItemText primary="Libreria Giochi" />
            </ListItemButton>
          </List>

          <List
            subheader={
              <ListSubheader sx={{ bgcolor: 'transparent', lineHeight: '32px' }}>
                STRUMENTI
              </ListSubheader>
            }
          >
            <ListItemButton selected={page === 'pannello'} onClick={() => goTo('pannello')}>
              <ListItemText primary="Pannello dell'Ispettore" />
              {!isLoggedIn && <Chip label="Accesso" size="small" variant="outlined" />}
            </ListItemButton>
          </List>

          <Box sx={{ mt: 'auto' }}>
            <Divider />
            <Box sx={{ p: 2 }}>
              {isLoggedIn ? (
                <>
                  <Typography variant="body2">GamerPro</Typography>
                  <Button size="small" onClick={logout} sx={{ p: 0, minWidth: 0 }}>
                    Esci
                  </Button>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Non hai effettuato l'accesso
                </Typography>
              )}
            </Box>
          </Box>
        </Drawer>

        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <AppBar
            position="static"
            color="inherit"
            elevation={0}
            sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.default' }}
          >
            <Toolbar sx={{ justifyContent: 'flex-end', gap: 1.5 }}>
              <Button variant="outlined" color="inherit" onClick={toggleMode}>
                Tema {mode === 'dark' ? 'chiaro' : 'scuro'}
              </Button>
              {!isLoggedIn && page !== 'auth' && (
                <Button variant="contained" onClick={openAuth}>
                  Accedi / Registrati
                </Button>
              )}
            </Toolbar>
          </AppBar>

          <Box component="main" sx={{ flex: 1, overflowY: 'auto', px: 6, py: 5 }}>
            <Box sx={{ maxWidth: 960, mx: 'auto' }}>{renderContent()}</Box>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}