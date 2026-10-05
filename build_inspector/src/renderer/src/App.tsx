import React, { useState, useRef, useMemo } from 'react';

// --- TYPES & INTERFACES ---
interface GameRequirement {
  cpu: string;
  gpu: string;
  ram: number; // in GB
}

interface Game {
  id: number;
  title: string;
  image: string;
  genre: string[];
  description: string;
  rating: number;
  releaseYear: number;
  minReq: GameRequirement;
  recReq: GameRequirement;
}

interface ComponentTier {
  id: string;
  name: string;
  score: number; // Score relative index (1 to 100)
}

const STEAM_GAMES: Game[] = [
  {
    id: 1,
    title: 'Counter-Strike 2',
    image: 'https://cdn.akamai.steamstatic.com/steam/apps/730/header.jpg',
    genre: ['FPS', 'Azione', 'Competitivo'],
    description: 'Il seguito naturale di CS:GO. Nuovo motore Source 2, grafica migliorata, fisica del fumo aggiornata e tick rate sub-tick.',
    rating: 8.8,
    releaseYear: 2023,
    minReq: { cpu: 'Intel Core i5-2500K / AMD FX-6300', gpu: 'GTX 1050 / RX 560', ram: 8 },
    recReq: { cpu: 'Intel Core i7-9700K / Ryzen 7 3700X', gpu: 'RTX 3060 / RX 6600 XT', ram: 16 }
  },
  {
    id: 2,
    title: 'Dota 2',
    image: 'https://cdn.akamai.steamstatic.com/steam/apps/570/header.jpg',
    genre: ['MOBA', 'Strategia', 'Multigiocatore'],
    description: 'Ogni giorno, milioni di giocatori in tutto il mondo entrano in battaglia nei panni di uno degli oltre cento eroi di Dota.',
    rating: 9.0,
    releaseYear: 2013,
    minReq: { cpu: 'Dual Core Intel/AMD 2.8 GHz', gpu: 'NVIDIA GeForce 8600/9600GT / AMD Radeon HD2600', ram: 4 },
    recReq: { cpu: 'Intel Core i5-8400 / Ryzen 5 2600', gpu: 'GTX 1060 / RX 580', ram: 8 }
  },
  {
    id: 3,
    title: 'Cyberpunk 2077',
    image: 'https://cdn.akamai.steamstatic.com/steam/apps/1091500/header.jpg',
    genre: ['RPG', 'Open World', 'Cyberpunk'],
    description: 'Cyberpunk 2077 è un GDR d’azione a mondo aperto ambientato nella megalopoli Night City, affamata di potere e glamour.',
    rating: 8.6,
    releaseYear: 2020,
    minReq: { cpu: 'Intel Core i7-6700 / AMD Ryzen 5 1600', gpu: 'GTX 1060 / RX 580', ram: 12 },
    recReq: { cpu: 'Intel Core i7-12700 / AMD Ryzen 7 7800X3D', gpu: 'RTX 3080 / RX 6800 XT', ram: 16 }
  },
  {
    id: 4,
    title: 'Elden Ring',
    image: 'https://cdn.akamai.steamstatic.com/steam/apps/1245620/header.jpg',
    genre: ['Souls-like', 'RPG', 'Open World'],
    description: 'ALZATI, SENZALUCE! Vivi un\'avventura fantasy epica nata dalla collaborazione tra Hidetaka Miyazaki e George R.R. Martin.',
    rating: 9.5,
    releaseYear: 2022,
    minReq: { cpu: 'Intel Core i5-8400 / AMD Ryzen 3 3300X', gpu: 'GTX 1060 3GB / RX 580 4GB', ram: 12 },
    recReq: { cpu: 'Intel Core i7-8700K / AMD Ryzen 5 3600X', gpu: 'GTX 1070 8GB / RX Vega 56 8GB', ram: 16 }
  },
  {
    id: 5,
    title: "Baldur's Gate 3",
    image: 'https://cdn.akamai.steamstatic.com/steam/apps/1086940/header.jpg',
    genre: ['RPG', 'Turni', 'Scelte tattiche'],
    description: 'Raccogli il tuo gruppo e torna nei Reami Dimenticati in una storia di amicizia, tradimento, sacrificio e sopravvivenza.',
    rating: 9.7,
    releaseYear: 2023,
    minReq: { cpu: 'Intel Core i5-4690 / AMD FX 8350', gpu: 'GTX 970 / RX 480', ram: 8 },
    recReq: { cpu: 'Intel Core i7-8700K / AMD Ryzen 5 3600X', gpu: 'RTX 2060 Super / RX 5700 XT', ram: 16 }
  },
  {
    id: 6,
    title: 'Helldivers 2',
    image: 'https://cdn.akamai.steamstatic.com/steam/apps/553850/header.jpg',
    genre: ['Azione', 'Co-op', 'Spara e Fuggi'],
    description: 'Unisciti agli Helldivers per lottare per la libertà in una galassia ostile in questo sparatutto in terza persona rapido e frenetico.',
    rating: 8.9,
    releaseYear: 2024,
    minReq: { cpu: 'Intel Core i7-4790K / AMD Ryzen 5 1500X', gpu: 'GTX 1050 Ti / RX 470', ram: 8 },
    recReq: { cpu: 'Intel Core i7-9700K / AMD Ryzen 7 3700X', gpu: 'RTX 2060 / RX 6600 XT', ram: 16 }
  }
];

const CPU_OPTIONS: ComponentTier[] = [
  { id: 'cpu_entry', name: 'Intel Core i3 / Ryzen 3 (Budget)', score: 35 },
  { id: 'cpu_mid', name: 'Intel Core i5-11400 / Ryzen 5 3600 (Mid-tier)', score: 60 },
  { id: 'cpu_high', name: 'Intel Core i7-13700K / Ryzen 7 7800X3D (High-End)', score: 92 },
  { id: 'cpu_ultra', name: 'Intel Core i9-14900K / Ryzen 9 7950X3D (Extreme)', score: 100 }
];

const GPU_OPTIONS: ComponentTier[] = [
  { id: 'gpu_entry', name: 'NVIDIA GTX 1050 Ti / RX 570 (Entry)', score: 30 },
  { id: 'gpu_mid', name: 'NVIDIA RTX 3060 / RX 6600 XT (Mainstream)', score: 62 },
  { id: 'gpu_high', name: 'NVIDIA RTX 4070 / RX 7800 XT (Enthusiast)', score: 85 },
  { id: 'gpu_ultra', name: 'NVIDIA RTX 4090 / RX 7900 XTX (God Tier)', score: 100 }
];

const RAM_OPTIONS = [8, 16, 32, 64];

const styles: { [key: string]: React.CSSProperties } = {
  appContainer: {
    position: 'relative',
    minHeight: '100vh',
    width: '100%',
    backgroundColor: '#0a0712',
    color: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    overflowX: 'hidden',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    paddingBottom: '4rem'
  },
  glowBackground: {
    position: 'fixed',
    inset: 0,
    pointerEvents: 'none',
    backgroundImage: `
      radial-gradient(circle at 50% 15%, rgba(138, 43, 226, 0.3) 0%, rgba(10, 7, 18, 0) 65%),
      radial-gradient(circle at 80% 80%, rgba(88, 28, 135, 0.25) 0%, rgba(10, 7, 18, 0) 50%),
      radial-gradient(circle at 20% 70%, rgba(147, 51, 234, 0.15) 0%, rgba(10, 7, 18, 0) 50%)
    `
  },
  glowElement: {
    position: 'fixed',
    top: '15%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '700px',
    height: '350px',
    backgroundColor: 'rgba(147, 51, 234, 0.15)',
    filter: 'blur(130px)',
    borderRadius: '50%',
    pointerEvents: 'none'
  },
  headerArea: {
    marginTop: '2.5rem',
    marginBottom: '2rem',
    position: 'relative',
    zIndex: 10,
    textAlign: 'center',
    padding: '0 1rem'
  },
  title: {
    fontSize: '3rem',
    fontWeight: '800',
    letterSpacing: '-0.025em',
    background: 'linear-gradient(135deg, #ffffff 30%, #c084fc 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: 0
  },
  subtitle: {
    color: '#a855f7',
    marginTop: '0.5rem',
    fontSize: '1rem',
    fontWeight: '500',
    letterSpacing: '0.05em',
    textTransform: 'uppercase'
  },
  filterSection: {
    position: 'relative',
    zIndex: 10,
    width: '100%',
    maxWidth: '1200px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1.25rem',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 1.5rem',
    marginBottom: '1.5rem'
  },
  filterControlGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flexWrap: 'wrap'
  },
  searchInput: {
    backgroundColor: 'rgba(23, 17, 38, 0.75)',
    border: '1px solid rgba(168, 85, 247, 0.35)',
    borderRadius: '10px',
    padding: '0.65rem 1rem',
    color: '#ffffff',
    fontSize: '0.95rem',
    outline: 'none',
    minWidth: '250px',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
  },
  categoryLabel: {
    color: '#d8b4fe',
    fontSize: '0.9rem',
    fontWeight: '600'
  },
  categoryDropdown: {
    backgroundColor: 'rgba(23, 17, 38, 0.85)',
    border: '1px solid rgba(168, 85, 247, 0.4)',
    borderRadius: '10px',
    padding: '0.65rem 1.25rem',
    color: '#ffffff',
    fontSize: '0.95rem',
    outline: 'none',
    cursor: 'pointer',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    minWidth: '200px'
  },
  carouselWrapper: {
    position: 'relative',
    zIndex: 10,
    width: '100%',
    maxWidth: '1250px',
    display: 'flex',
    alignItems: 'center',
    padding: '0 1rem'
  },
  arrowButton: {
    backgroundColor: 'rgba(23, 17, 38, 0.8)',
    border: '1px solid rgba(168, 85, 247, 0.4)',
    color: '#ffffff',
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    fontSize: '1.8rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    backdropFilter: 'blur(10px)',
    userSelect: 'none',
    flexShrink: 0,
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
  },
  scrollContainer: {
    display: 'flex',
    gap: '1.25rem',
    overflowX: 'auto',
    scrollBehavior: 'smooth',
    scrollbarWidth: 'none',
    padding: '1rem 0.5rem',
    width: '100%'
  },
  gameCard: {
    position: 'relative',
    minWidth: '290px',
    maxWidth: '290px',
    height: '220px',
    borderRadius: '16px',
    overflow: 'hidden',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    backdropFilter: 'blur(10px)',
    flexShrink: 0,
    cursor: 'pointer',
    transition: 'transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease'
  },
  selectedCard: {
    borderColor: '#c084fc',
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 25px rgba(168, 85, 247, 0.45)'
  },
  cardImage: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  cardOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to top, rgba(10, 7, 18, 0.95) 0%, rgba(10, 7, 18, 0.4) 60%, transparent 100%)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    padding: '1.25rem'
  },
  gameTitle: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    marginBottom: '0.4rem',
    color: '#ffffff',
    textShadow: '0 2px 4px rgba(0,0,0,0.8)'
  },
  tagContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.35rem'
  },
  tag: {
    backgroundColor: 'rgba(138, 43, 226, 0.35)',
    color: '#e9d5ff',
    fontSize: '0.7rem',
    padding: '0.2rem 0.55rem',
    borderRadius: '6px',
    border: '1px solid rgba(192, 132, 252, 0.25)',
    backdropFilter: 'blur(4px)'
  },
  inspectorPanel: {
    position: 'relative',
    zIndex: 10,
    width: '100%',
    maxWidth: '1200px',
    marginTop: '2.5rem',
    padding: '0 1rem',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '1.5rem'
  },
  panelCard: {
    backgroundColor: 'rgba(20, 14, 35, 0.75)',
    borderRadius: '16px',
    border: '1px solid rgba(168, 85, 247, 0.25)',
    padding: '1.75rem',
    backdropFilter: 'blur(16px)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  },
  panelTitle: {
    fontSize: '1.3rem',
    fontWeight: 'bold',
    color: '#e9d5ff',
    marginBottom: '1.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    borderBottom: '1px solid rgba(168, 85, 247, 0.2)',
    paddingBottom: '0.75rem'
  },
  selectGroup: {
    marginBottom: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem'
  },
  selectLabel: {
    fontSize: '0.85rem',
    color: '#c084fc',
    fontWeight: '600'
  },
  select: {
    backgroundColor: 'rgba(10, 7, 18, 0.8)',
    border: '1px solid rgba(168, 85, 247, 0.3)',
    borderRadius: '8px',
    padding: '0.65rem 0.8rem',
    color: '#ffffff',
    fontSize: '0.9rem',
    outline: 'none',
    cursor: 'pointer'
  },
  specBox: {
    backgroundColor: 'rgba(10, 7, 18, 0.5)',
    borderRadius: '8px',
    padding: '0.75rem',
    fontSize: '0.85rem',
    borderLeft: '3px solid #a855f7',
    marginBottom: '0.75rem'
  },
  specTitle: {
    fontWeight: 'bold',
    color: '#d8b4fe',
    marginBottom: '0.2rem'
  },
  fpsMeterContainer: {
    textAlign: 'center',
    padding: '1.5rem 1rem',
    backgroundColor: 'rgba(10, 7, 18, 0.6)',
    borderRadius: '12px',
    border: '1px solid rgba(168, 85, 247, 0.2)',
    marginTop: '0.5rem'
  },
  fpsNumber: {
    fontSize: '3.5rem',
    fontWeight: '900',
    lineHeight: 1
  },
  fpsLabel: {
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: '#a855f7',
    marginTop: '0.5rem'
  },
  qualityBadge: {
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    marginTop: '0.75rem'
  }
};

function App(): React.JSX.Element {
  const scrollRef = useRef<HTMLDivElement>(null);

  const [selectedGame, setSelectedGame] = useState<Game>(STEAM_GAMES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('Tutti i generi');

  const [selectedCpu, setSelectedCpu] = useState<ComponentTier>(CPU_OPTIONS[1]);
  const [selectedGpu, setSelectedGpu] = useState<ComponentTier>(GPU_OPTIONS[1]);
  const [selectedRam, setSelectedRam] = useState<number>(16);

  const genres = useMemo(() => {
    const set = new Set<string>();
    STEAM_GAMES.forEach(g => g.genre.forEach(gen => set.add(gen)));
    return ['Tutti i generi', ...Array.from(set)];
  }, []);

  const filteredGames = useMemo(() => {
    return STEAM_GAMES.filter(game => {
      const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGenre = selectedGenre === 'Tutti i generi' || game.genre.includes(selectedGenre);
      return matchesSearch && matchesGenre;
    });
  }, [searchQuery, selectedGenre]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 310;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const performanceMetrics = useMemo(() => {
    const hardwareScore = (selectedCpu.score * 0.35) + (selectedGpu.score * 0.55) + (Math.min(selectedRam, 32) / 32 * 10);
    const gameLoadFactor = (selectedGame.releaseYear - 2010) * 4;
    const estimated1080pFPS = Math.max(25, Math.round((hardwareScore * 1.8) - gameLoadFactor + 20));

    let statusColor = '#22c55e';
    let statusText = 'Eccellente';

    if (estimated1080pFPS < 30) {
      statusColor = '#ef4444';
      statusText = 'Non Consigliato';
    } else if (estimated1080pFPS < 60) {
      statusColor = '#f59e0b';
      statusText = 'Giocabile (Medio/Basso)';
    } else if (estimated1080pFPS < 100) {
      statusColor = '#3b82f6';
      statusText = 'Fluido (Alto)';
    }

    return {
      fps: estimated1080pFPS,
      statusColor,
      statusText
    };
  }, [selectedCpu, selectedGpu, selectedRam, selectedGame]);

  return (
    <div style={styles.appContainer}>

      <div style={styles.glowBackground} />
      <div style={styles.glowElement} />

      <header style={styles.headerArea}>
        <h1 style={styles.title}>Build Inspector</h1>
        <div style={styles.subtitle}>Steam Hardware Compatibility & Performance Analyzer</div>
      </header>

      <div style={styles.filterSection}>
        <input
          type="text"
          placeholder="Cerca un gioco..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
        />

        <div style={styles.filterControlGroup}>
          <label htmlFor="genre-select" style={styles.categoryLabel}>
            Categoria / Genere:
          </label>
          <select
            id="genre-select"
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            style={styles.categoryDropdown}
          >
            {genres.map(g => (
              <option key={g} value={g} style={{ backgroundColor: '#0a0712', color: '#ffffff' }}>
                {g}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filtered Games Carousel */}
      <div style={styles.carouselWrapper}>
        <button
          style={styles.arrowButton}
          onClick={() => handleScroll('left')}
          aria-label="Scorri a sinistra"
        >
          ‹
        </button>

        <div
          ref={scrollRef}
          style={styles.scrollContainer}
        >
          {filteredGames.length > 0 ? (
            filteredGames.map((game) => {
              const isSelected = selectedGame.id === game.id;
              return (
                <div
                  key={game.id}
                  onClick={() => setSelectedGame(game)}
                  style={{
                    ...styles.gameCard,
                    ...(isSelected ? styles.selectedCard : {})
                  }}
                >
                  <img src={game.image} alt={game.title} style={styles.cardImage} />
                  <div style={styles.cardOverlay}>
                    <h2 style={styles.gameTitle}>{game.title}</h2>
                    <div style={styles.tagContainer}>
                      {game.genre.map((g, index) => (
                        <span key={index} style={styles.tag}>
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ padding: '2rem', color: '#a855f7', fontWeight: 'bold' }}>
              Nessun gioco trovato per la categoria "{selectedGenre}".
            </div>
          )}
        </div>

        <button
          style={styles.arrowButton}
          onClick={() => handleScroll('right')}
          aria-label="Scorri a destra"
        >
          ›
        </button>
      </div>

      {/* Main Inspection & Benchmark Panel */}
      <div style={styles.inspectorPanel}>
        {/* Selected Game Card */}
        <div style={styles.panelCard}>
          <div>
            <div style={styles.panelTitle}>
              <span>🎮</span> {selectedGame.title}
            </div>

            <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.4', marginBottom: '1.25rem' }}>
              {selectedGame.description}
            </p>

            <div style={styles.specBox}>
              <div style={styles.specTitle}>Requisiti Minimi:</div>
              <div>CPU: {selectedGame.minReq.cpu}</div>
              <div>GPU: {selectedGame.minReq.gpu}</div>
              <div>RAM: {selectedGame.minReq.ram} GB</div>
            </div>

            <div style={styles.specBox}>
              <div style={styles.specTitle}>Requisiti Consigliati:</div>
              <div>CPU: {selectedGame.recReq.cpu}</div>
              <div>GPU: {selectedGame.recReq.gpu}</div>
              <div>RAM: {selectedGame.recReq.ram} GB</div>
            </div>
          </div>

          <div style={{ fontSize: '0.8rem', color: '#a855f7', marginTop: '1rem' }}>
            Valutazione: ★ {selectedGame.rating}/10 ({selectedGame.releaseYear})
          </div>
        </div>

        {/* PC Configurator */}
        <div style={styles.panelCard}>
          <div>
            <div style={styles.panelTitle}>
              <span>💻</span> Configura Hardware PC
            </div>

            <div style={styles.selectGroup}>
              <label style={styles.selectLabel}>Processore (CPU):</label>
              <select
                style={styles.select}
                value={selectedCpu.id}
                onChange={(e) => setSelectedCpu(CPU_OPTIONS.find(c => c.id === e.target.value) || CPU_OPTIONS[0])}
              >
                {CPU_OPTIONS.map(cpu => (
                  <option key={cpu.id} value={cpu.id}>{cpu.name}</option>
                ))}
              </select>
            </div>

            <div style={styles.selectGroup}>
              <label style={styles.selectLabel}>Scheda Grafica (GPU):</label>
              <select
                style={styles.select}
                value={selectedGpu.id}
                onChange={(e) => setSelectedGpu(GPU_OPTIONS.find(g => g.id === e.target.value) || GPU_OPTIONS[0])}
              >
                {GPU_OPTIONS.map(gpu => (
                  <option key={gpu.id} value={gpu.id}>{gpu.name}</option>
                ))}
              </select>
            </div>

            <div style={styles.selectGroup}>
              <label style={styles.selectLabel}>Memoria RAM:</label>
              <select
                style={styles.select}
                value={selectedRam}
                onChange={(e) => setSelectedRam(Number(e.target.value))}
              >
                {RAM_OPTIONS.map(ram => (
                  <option key={ram} value={ram}>{ram} GB DDR4/DDR5</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Performance Estimator */}
        <div style={styles.panelCard}>
          <div>
            <div style={styles.panelTitle}>
              <span>⚡</span> Prestazioni Stimate
            </div>

            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
              Stima delle prestazioni a 1080p (Full HD) per <strong>{selectedGame.title}</strong>:
            </p>

            <div style={styles.fpsMeterContainer}>
              <div style={{ ...styles.fpsNumber, color: performanceMetrics.statusColor }}>
                {performanceMetrics.fps}
              </div>
              <div style={styles.fpsLabel}>FPS Medio Stimato</div>

              <div style={{
                ...styles.qualityBadge,
                backgroundColor: `${performanceMetrics.statusColor}22`,
                color: performanceMetrics.statusColor,
                border: `1px solid ${performanceMetrics.statusColor}55`
              }}>
                {performanceMetrics.statusText}
              </div>
            </div>
          </div>

          <div style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center', marginTop: '1rem' }}>
            * Le prestazioni reali possono variare in base ai driver e alle impostazioni grafiche.
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;