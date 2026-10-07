import React, { useEffect, useState } from 'react';
import { PreRegistrazione, Game } from './pre-registrazione';
import { AuthModal } from './Login';
import './styles.css';

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

type Page = 'libreria' | 'fps' | 'bottleneck';
type Theme = 'dark' | 'light';

const TOOLS: { id: Page; label: string }[] = [
  { id: 'fps', label: 'Calcolatore FPS' },
  { id: 'bottleneck', label: 'Colli di Bottiglia' }
];

export default function App(): React.JSX.Element {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [page, setPage] = useState<Page>('libreria');

  const [selectedGenre, setSelectedGenre] = useState<string>('Tutti i generi');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem('theme') as Theme | null) ?? 'dark'
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  const filteredGames = STEAM_GAMES.filter((game) => {
    const matchesGenre = selectedGenre === 'Tutti i generi' || game.genre.includes(selectedGenre);
    const matchesSearch = game.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesGenre && matchesSearch;
  });

  const goTo = (target: Page) => {
    if (target !== 'libreria' && !isLoggedIn) {
      setShowAuthModal(true);
      return;
    }
    setPage(target);
  };

  const logout = () => {
    setIsLoggedIn(false);
    setPage('libreria');
  };

  const currentTool = TOOLS.find((t) => t.id === page);

  return (
    <div className="layout">
      <aside className="sidebar">
        <div
          className="brand"
          onClick={() => {
            setPage('libreria');
            setSelectedGenre('Tutti i generi');
            setSearchTerm('');
          }}
        >
          Build<span>Inspector</span>
        </div>

        <div className="sidebar-group">
          <div className="sidebar-title">Introduzione</div>
          <button
            className={`sidebar-link ${page === 'libreria' ? 'active' : ''}`}
            onClick={() => goTo('libreria')}
          >
            Libreria Giochi
          </button>
        </div>

        <div className="sidebar-group">
          <div className="sidebar-title">Strumenti</div>
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              className={`sidebar-link ${page === tool.id ? 'active' : ''}`}
              onClick={() => goTo(tool.id)}
            >
              {tool.label}
              {!isLoggedIn && <span className="sidebar-badge">Accesso</span>}
            </button>
          ))}
        </div>

        <div className="sidebar-footer">
          {isLoggedIn ? (
            <>
              <div>GamerPro</div>
              <button className="btn-link" onClick={logout}>
                Esci
              </button>
            </>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>Non hai effettuato l'accesso</span>
          )}
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button
            className="btn"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            Tema {theme === 'dark' ? 'chiaro' : 'scuro'}
          </button>
          {!isLoggedIn && (
            <button className="btn btn-primary" onClick={() => setShowAuthModal(true)}>
              Accedi / Registrati
            </button>
          )}
        </header>

        <main className="content">
          <div className="content-inner">
            {!isLoggedIn ? (
              <PreRegistrazione
                games={filteredGames}
                allGenres={ALL_GENRES}
                selectedGenre={selectedGenre}
                onSelectGenre={setSelectedGenre}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onOpenAuth={() => setShowAuthModal(true)}
              />
            ) : page === 'libreria' ? (
              <>
                <h1 className="page-title">Pannello dell'Ispettore</h1>
                <p className="lead">
                  Hai effettuato l'accesso. Da qui puoi gestire le tue componenti e configurare la
                  tua build.
                </p>
              </>
            ) : (
              <>
                <h1 className="page-title">{currentTool?.label}</h1>
                <p className="lead">Questa sezione è in sviluppo.</p>
              </>
            )}
          </div>
        </main>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLoginSuccess={() => setIsLoggedIn(true)}
      />
    </div>
  );
}