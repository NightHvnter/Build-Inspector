import { useState } from "react";

export function Home() {
  const [gameSearch, setGameSearch] = useState("");

  return (
    <div className="home-container">
      <h2>Verifica Requisiti Gioco</h2>
      
      {/* Campo di ricerca */}
      <div className="search-box">
        <input
          type="text"
          placeholder="Cerca un gioco (es. Cyberpunk 2077)..."
          value={gameSearch}
          onChange={(e) => setGameSearch(e.target.value)}
        />
        <button>Analizza PC</button>
      </div>

      {/* Scheda specifiche hardware */}
      <div className="specs-card">
        <h3>Specifiche Rilevate</h3>
        <p><strong>CPU:</strong> In attesa di scansione...</p>
        <p><strong>RAM:</strong> In attesa di scansione...</p>
        <p><strong>GPU:</strong> In attesa di scansione...</p>
      </div>
    </div>
  );
}