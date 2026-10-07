import React from 'react';

export interface Game {
  id: number;
  title: string;
  image: string;
  genre: string[];
  description: string;
  reqCpu: string;
  reqGpu: string;
  reqRam: number;
  baseFps: number;
}

interface PreRegistrazioneProps {
  games: Game[];
  allGenres: string[];
  selectedGenre: string;
  onSelectGenre: (genre: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onOpenAuth: () => void;
}

export const PreRegistrazione: React.FC<PreRegistrazioneProps> = ({
  games,
  allGenres,
  selectedGenre,
  onSelectGenre,
  searchTerm,
  onSearchChange,
  onOpenAuth
}) => {
  return (
    <>
      <h1 className="page-title">Libreria Giochi</h1>
      <p className="lead">
        Sfoglia i giochi Steam più popolari e controlla i loro requisiti. Accedi per stimare gli FPS
        con la tua configurazione.
      </p>

      <h2 className="section-title">Giochi disponibili</h2>

      <div className="filters">
        <div>
          <label htmlFor="genre-select">Categoria</label>
          <select
            id="genre-select"
            className="input"
            value={selectedGenre}
            onChange={(e) => onSelectGenre(e.target.value)}
          >
            {allGenres.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
        </div>

        <input
          type="text"
          className="input"
          placeholder="Cerca un gioco..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {games.length > 0 ? (
        <div className="games-grid">
          {games.map((game) => (
            <div key={game.id} className="game-card" onClick={onOpenAuth}>
              <img src={game.image} alt={game.title} />
              <div className="game-card-body">
                <h3 className="game-title">{game.title}</h3>
                <div className="tags">
                  {game.genre.map((g) => (
                    <span key={g} className="tag">
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="empty">Nessun gioco trovato in questa categoria.</p>
      )}

      <div className="callout">
        <h3>Vuoi testare le prestazioni del tuo PC?</h3>
        <p>
          Registrati gratuitamente per sbloccare l'Ispettore Hardware. Potrai selezionare la tua{' '}
          <strong>CPU, GPU e RAM</strong>, scoprire gli <strong>FPS stimati</strong> per ogni gioco
          ed evitare i colli di bottiglia.
        </p>
        <button className="btn btn-primary" onClick={onOpenAuth}>
          Registrati per sbloccare i benchmark
        </button>
      </div>
    </>
  );
};