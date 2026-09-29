import React, { useState } from 'react';
const STEAM_GAMES = [
  {
    title: "Cyberpunk 2077",
    appId: "1091500",
    bg: "https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/header.jpg",
    hero: "https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/page_bg_generated_v6.jpg"
  },
  {
    title: "Elden Ring",
    appId: "1245620",
    bg: "https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/header.jpg",
    hero: "https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/page_bg_generated_v6.jpg"
  },
  {
    title: "Counter-Strike 2",
    appId: "730",
    bg: "https://cdn.cloudflare.steamstatic.com/steam/apps/730/header.jpg",
    hero: "https://cdn.cloudflare.steamstatic.com/steam/apps/730/page_bg_generated_v6.jpg"
  },
  {
    title: "Dota 2",
    appId: "570",
    bg: "https://cdn.cloudflare.steamstatic.com/steam/apps/570/header.jpg",
    hero: "https://cdn.cloudflare.steamstatic.com/steam/apps/570/page_bg_generated_v6.jpg"
  },
  {
    title: "The Witcher 3: Wild Hunt",
    appId: "292030",
    bg: "https://cdn.cloudflare.steamstatic.com/steam/apps/292030/header.jpg",
    hero: "https://cdn.cloudflare.steamstatic.com/steam/apps/292030/page_bg_generated_v6.jpg"
  }
];

interface HomeCoverProps {
  onOpenDashboard: () => void;
}

export const HomeCover: React.FC<HomeCoverProps> = ({ onOpenDashboard }) => {
  const [currentGameIndex, setCurrentGameIndex] = useState(0);

  const currentGame = STEAM_GAMES[currentGameIndex];

  const handleNextRandomGame = () => {
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * STEAM_GAMES.length);
    } while (nextIndex === currentGameIndex && STEAM_GAMES.length > 1);
    
    setCurrentGameIndex(nextIndex);
  };

  return (
    <div style={{
      position: 'relative',
      minHeight: 'calc(100vh - 60px)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.6), rgba(15, 23, 42, 0.95)), url(${currentGame.hero})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      transition: 'background-image 0.5s ease-in-out',
      color: '#fff',
      padding: '40px',
      textAlign: 'center'
    }}>
      {/* Badge del gioco attivo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', backgroundColor: 'rgba(0,0,0,0.5)', padding: '8px 16px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.2)' }}>
        <img src={currentGame.bg} alt={currentGame.title} style={{ height: '30px', borderRadius: '4px' }} />
        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Gioco Sfondo: {currentGame.title}</span>
      </div>

      <h1 style={{ fontSize: '48px', margin: '0 0 16px 0', textShadow: '0 4px 12px rgba(0,0,0,0.8)' }}>
        Build Inspector Gaming Edition
      </h1>
      <p style={{ fontSize: '18px', maxWidth: '600px', color: '#cbd5e1', marginBottom: '32px', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
        Ispeziona i file di log, analizza le build dei tuoi giochi e verifica i report di errore in tempo reale.
      </p>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <button 
          onClick={onOpenDashboard}
          style={{ backgroundColor: '#38bdf8', color: '#0f172a', border: 'none', padding: '14px 28px', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 14px rgba(56, 189, 248, 0.4)' }}
        >
          🚀 Apri Dashboard Ispezione
        </button>

        <button 
          onClick={handleNextRandomGame}
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.3)', padding: '14px 28px', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', backdropFilter: 'blur(5px)' }}
        >
          🎲 Cambia Copertina Steam
        </button>
      </div>
    </div>
  );
};