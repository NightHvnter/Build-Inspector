import React, { useRef } from 'react';

interface Game {
  id: number;
  title: string;
  image: string;
  genre: string[];
}

const STEAM_GAMES: Game[] = [
  {
    id: 1,
    title: 'Counter-Strike 2',
    image: 'https://cdn.akamai.steamstatic.com/steam/apps/730/header.jpg',
    genre: ['FPS', 'Azione', 'Competitivo']
  },
  {
    id: 2,
    title: 'Dota 2',
    image: 'https://cdn.akamai.steamstatic.com/steam/apps/570/header.jpg',
    genre: ['MOBA', 'Strategia', 'Multigiocatore']
  },
  {
    id: 3,
    title: 'Cyberpunk 2077',
    image: 'https://cdn.akamai.steamstatic.com/steam/apps/1091500/header.jpg',
    genre: ['RPG', 'Open World', 'Cyberpunk']
  },
  {
    id: 4,
    title: 'Elden Ring',
    image: 'https://cdn.akamai.steamstatic.com/steam/apps/1245620/header.jpg',
    genre: ['Souls-like', 'RPG', 'Open World']
  },
  {
    id: 5,
    title: 'Baldur\'s Gate 3',
    image: 'https://cdn.akamai.steamstatic.com/steam/apps/1086940/header.jpg',
    genre: ['RPG', 'Turni', 'Scelte tattiche']
  },
  {
    id: 6,
    title: 'Helldivers 2',
    image: 'https://cdn.akamai.steamstatic.com/steam/apps/553850/header.jpg',
    genre: ['Azione', 'Co-op', 'Spara e Fuggi']
  }
];

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
    overflow: 'hidden',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  glowBackground: {
    position: 'fixed',
    inset: 0,
    pointerEvents: 'none',
    backgroundImage: `
      radial-gradient(circle at 50% 20%, rgba(138, 43, 226, 0.35) 0%, rgba(10, 7, 18, 0) 65%),
      radial-gradient(circle at 80% 80%, rgba(88, 28, 135, 0.25) 0%, rgba(10, 7, 18, 0) 50%)
    `
  },
  glowElement: {
    position: 'fixed',
    top: '20%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '600px',
    height: '350px',
    backgroundColor: 'rgba(147, 51, 234, 0.18)',
    filter: 'blur(120px)',
    borderRadius: '50%',
    pointerEvents: 'none'
  },
  headerArea: {
    marginTop: '3rem',
    marginBottom: '3rem',
    position: 'relative',
    zIndex: 10,
    textAlign: 'center'
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: '#ffffff',
    margin: 0
  },
  carouselWrapper: {
    position: 'relative',
    zIndex: 10,
    width: '100%',
    maxWidth: '1200px',
    display: 'flex',
    alignItems: 'center',
    padding: '0 1rem'
  },
  arrowButton: {
    backgroundColor: 'rgba(23, 17, 38, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    color: '#ffffff',
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    fontSize: '1.5rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    backdropFilter: 'blur(10px)',
    userSelect: 'none',
    flexShrink: 0
  },
  scrollContainer: {
    display: 'flex',
    gap: '1.5rem',
    overflowX: 'auto',
    scrollBehavior: 'smooth',
    scrollbarWidth: 'none', /* Firefox */
    padding: '1rem 0.5rem',
    width: '100%'
  },
  gameCard: {
    position: 'relative',
    minWidth: '300px',
    maxWidth: '300px',
    height: '220px',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    flexShrink: 0
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
    background: 'linear-gradient(to top, rgba(10, 7, 18, 0.95) 0%, rgba(10, 7, 18, 0.3) 60%, transparent 100%)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    padding: '1.25rem'
  },
  gameTitle: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
    color: '#ffffff'
  },
  tagContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.4rem'
  },
  tag: {
    backgroundColor: 'rgba(138, 43, 226, 0.3)',
    color: '#e9d5ff',
    fontSize: '0.75rem',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    border: '1px solid rgba(192, 132, 252, 0.2)',
    backdropFilter: 'blur(4px)'
  }
};

function App(): React.JSX.Element {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Funzione per scorrere verso sinistra o destra
  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320; // Distanza di scorrimento ad ogni click
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div style={styles.appContainer}>
      {/* Sfondo sfumato e bagliore */}
      <div style={styles.glowBackground} />
      <div style={styles.glowElement} />

      {/* Titolo in alto */}
      <div style={styles.headerArea}>
        <h1 style={styles.title}>Build Inspector</h1>
      </div>

      {/* Carosello su un'unica riga con frecce */}
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
          className="hide-scrollbar"
        >
          {STEAM_GAMES.map((game) => (
            <div key={game.id} style={styles.gameCard}>
              {/* Immagine a tutto campo */}
              <img src={game.image} alt={game.title} style={styles.cardImage} />
              
              {/* Testo in sovrimpressione con gradient scuro */}
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
          ))}
        </div>

        <button 
          style={styles.arrowButton} 
          onClick={() => handleScroll('right')}
          aria-label="Scorri a destra"
        >
          ›
        </button>
      </div>
    </div>
  );
}

export default App;