import { useState, type JSX } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  TextField
} from '@mui/material'
import { Icon } from './components/Icon'
import { PreRegistrazione } from './pre-registrazione'
import type { Game } from './games'
import type { Profile } from './auth'

interface LibraryProps {
  games: Game[]
  favorites: number[]
  favoritesOnly: boolean
  selectedGenre: string
  onSelectGenre: (genre: string) => void
  searchTerm: string
  onSearchChange: (term: string) => void
  profile: Profile | null
  onToggleFavorite: (id: number) => void
  onOpenBuild: () => void
  onOpenAuth: () => void
}

function GameCover({ game }: { game: Game }): JSX.Element {
  const [failed, setFailed] = useState(false)
  return (
    <div className={`game-cover cover-${game.id}`}>
      {failed ? (
        <div className="cover-fallback">
          <Icon name="game" size={42} />
          <strong>{game.title}</strong>
        </div>
      ) : (
        <img src={game.image} alt="" loading="lazy" onError={() => setFailed(true)} />
      )}
      <span className="platform-badge">PC</span>
    </div>
  )
}

export function Library({
  games,
  favorites,
  favoritesOnly,
  selectedGenre,
  onSelectGenre,
  searchTerm,
  onSearchChange,
  profile,
  onToggleFavorite,
  onOpenBuild,
  onOpenAuth
}: LibraryProps): JSX.Element {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [sort, setSort] = useState('featured')
  const genres = ['Tutti i generi', ...Array.from(new Set(games.flatMap((game) => game.genre)))]
  const filtered = games.filter(
    (game) =>
      (!favoritesOnly || favorites.includes(game.id)) &&
      (selectedGenre === 'Tutti i generi' || game.genre.includes(selectedGenre)) &&
      game.title.toLocaleLowerCase().includes(searchTerm.trim().toLocaleLowerCase())
  )
  if (sort === 'alphabetical') filtered.sort((a, b) => a.title.localeCompare(b.title))
  const hasFilters = !!searchTerm || selectedGenre !== 'Tutti i generi'
  const reset = (): void => {
    onSelectGenre('Tutti i generi')
    onSearchChange('')
  }
  const openBuild = (): void => {
    setSelectedGame(null)
    onOpenBuild()
  }

  return (
    <>
      {!favoritesOnly && (
        <PreRegistrazione isLoggedIn={!!profile} onOpenAuth={profile ? onOpenBuild : onOpenAuth} />
      )}
      <section className="catalog" aria-labelledby="catalog-title">
        <div className="section-heading">
          <div>
            <h2 id="catalog-title">
              {favoritesOnly ? 'I tuoi preferiti' : 'Catalogo'}
              <span className="count-pill">{favoritesOnly ? favorites.length : games.length}</span>
            </h2>
          </div>
          <span className="catalog-caption">
            {favoritesOnly
              ? 'Giochi salvati nel tuo profilo.'
              : 'Seleziona un gioco per vedere i dettagli.'}
          </span>
        </div>
        <div className="catalog-filters">
          <div className="search-field">
            <Icon name="search" size={19} />
            <input
              aria-label="Cerca un gioco"
              placeholder="Cerca un gioco…"
              value={searchTerm}
              onChange={(event) => onSearchChange(event.target.value)}
            />
            {searchTerm && (
              <button
                className="icon-button"
                onClick={() => onSearchChange('')}
                aria-label="Cancella ricerca"
              >
                <Icon name="close" size={16} />
              </button>
            )}
          </div>
          <TextField
            select
            size="small"
            label="Genere"
            value={selectedGenre}
            onChange={(event) => onSelectGenre(event.target.value)}
            sx={{ width: { xs: '100%', sm: 185 } }}
          >
            {genres.map((genre) => (
              <MenuItem key={genre} value={genre}>
                {genre}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Ordina per"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            sx={{ width: { xs: '100%', sm: 165 } }}
          >
            <MenuItem value="featured">In evidenza</MenuItem>
            <MenuItem value="alphabetical">Nome A–Z</MenuItem>
          </TextField>
        </div>
        <div className="results-line">
          <span role="status">
            {filtered.length} {filtered.length === 1 ? 'gioco disponibile' : 'giochi disponibili'}
          </span>
          {hasFilters && (
            <button className="text-action" onClick={reset}>
              Azzera filtri
              <Icon name="close" size={13} />
            </button>
          )}
          <span className="demo-caption">Catalogo dimostrativo</span>
        </div>
        {filtered.length ? (
          <div className="games-grid">
            {filtered.map((game) => (
              <article className="game-card" key={game.id}>
                <button
                  className="game-open"
                  onClick={() => setSelectedGame(game)}
                  aria-label={`Scopri ${game.title}`}
                >
                  <GameCover game={game} />
                  <div className="game-card-body">
                    <div className="game-genres">{game.genre.slice(0, 2).join(' / ')}</div>
                    <h3>{game.title}</h3>
                    <p>{game.description}</p>
                    <div className="game-card-bottom">
                      <span>Vedi requisiti</span>
                      <Icon name="arrow" size={17} />
                    </div>
                  </div>
                </button>
                <button
                  className={`favorite-button ${favorites.includes(game.id) ? 'is-favorite' : ''}`}
                  onClick={() => onToggleFavorite(game.id)}
                  aria-label={`${favorites.includes(game.id) ? 'Rimuovi' : 'Aggiungi'} ${game.title} ${favorites.includes(game.id) ? 'dai' : 'ai'} preferiti`}
                  aria-pressed={favorites.includes(game.id)}
                  title={profile ? 'Preferiti' : 'Crea un profilo per salvare i preferiti'}
                >
                  <Icon name="heart" size={18} />
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span>
              <Icon name={favoritesOnly && !hasFilters ? 'heart' : 'search'} size={32} />
            </span>
            <h3>
              {favoritesOnly && !hasFilters ? 'Nessun preferito salvato.' : 'Nessun gioco trovato.'}
            </h3>
            <p>
              {favoritesOnly && !hasFilters
                ? 'Tocca il cuore nel catalogo: ritroverai qui i tuoi preferiti.'
                : 'Prova un altro titolo o rimuovi i filtri selezionati.'}
            </p>
            {hasFilters && (
              <Button variant="outlined" onClick={reset}>
                Azzera i filtri
              </Button>
            )}
          </div>
        )}
      </section>
      <footer className="catalog-footer">
        <span>
          <Icon name="chip" size={16} />
          Build Inspector
        </span>
        <span>Catalogo dimostrativo</span>
      </footer>
      <Dialog
        open={!!selectedGame}
        onClose={() => setSelectedGame(null)}
        fullWidth
        maxWidth="sm"
        aria-labelledby="game-dialog-title"
      >
        {selectedGame && (
          <>
            <DialogTitle id="game-dialog-title" sx={{ pr: 7, fontWeight: 750 }}>
              {selectedGame.title}
              <IconButton
                onClick={() => setSelectedGame(null)}
                aria-label="Chiudi dettagli gioco"
                sx={{ position: 'absolute', right: 12, top: 12 }}
              >
                <Icon name="close" />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <GameCover key={selectedGame.id} game={selectedGame} />
              <p>{selectedGame.description}</p>
              <div className="tags">
                {selectedGame.genre.map((genre) => (
                  <span key={genre}>{genre}</span>
                ))}
              </div>
              <h3 className="requirements-title">Configurazione di riferimento</h3>
              <dl className="game-requirements">
                <dt>CPU</dt>
                <dd>{selectedGame.reqCpu}</dd>
                <dt>GPU</dt>
                <dd>{selectedGame.reqGpu}</dd>
                <dt>RAM</dt>
                <dd>{selectedGame.reqRam} GB</dd>
              </dl>
              <p className="data-note">
                Dati dimostrativi del catalogo: verifica i requisiti ufficiali prima di acquistare
                un gioco.
              </p>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 0 }}>
              <Button
                color="inherit"
                onClick={() => onToggleFavorite(selectedGame.id)}
                startIcon={<Icon name="heart" size={17} />}
              >
                {favorites.includes(selectedGame.id)
                  ? 'Rimuovi dai preferiti'
                  : 'Salva nei preferiti'}
              </Button>
              <Button variant="contained" onClick={openBuild}>
                Configura il mio PC
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  )
}
