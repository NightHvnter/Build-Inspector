import { useState, type JSX } from 'react'
import { Alert, Box, Button, Divider, Stack, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { STEAM_GAMES, type Game } from './games'
import { useAuth } from './hooks/useAuth'
import { useCatalog } from './hooks/useCatalog'
import { useFavorites } from './hooks/useFavorites'
import { PreRegistrazione } from './pre-registrazione'
import { GameCard } from './components/catalog/GameCard'
import { GameDetails } from './components/catalog/GameDetails'
import { GameFilters } from './components/catalog/GameFilters'
import { EmptyState } from './components/common/EmptyState'

export function Library({ favoritesOnly = false }: { favoritesOnly?: boolean }): JSX.Element {
  const { user } = useAuth()
  const { favorites, error, toggleFavorite } = useFavorites(user?.id)
  const catalog = useCatalog(favorites, favoritesOnly)
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const navigate = useNavigate()
  const onFavorite = (id: number): void => {
    if (!user) {
      navigate('/registrazione?next=%2Fpreferiti')
      return
    }
    toggleFavorite(id)
  }
  return (
    <>
      {!favoritesOnly && <PreRegistrazione isLoggedIn={!!user} />}
      <Box component="section" aria-labelledby="catalog-title">
        <Stack
          direction="row"
          sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}
        >
          <Typography id="catalog-title" component={favoritesOnly ? 'h1' : 'h2'} variant="h5">
            {favoritesOnly ? 'I tuoi preferiti' : 'Catalogo'} (
            {favoritesOnly ? favorites.length : STEAM_GAMES.length})
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: { xs: 'none', lg: 'block' } }}
          >
            Seleziona un gioco per vedere i dettagli.
          </Typography>
        </Stack>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <GameFilters
          search={catalog.search}
          genre={catalog.genre}
          genres={catalog.genres}
          sort={catalog.sort}
          onChange={catalog.updateFilters}
        />
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', my: 2 }}>
          <Typography variant="caption" color="text.secondary" role="status">
            {catalog.games.length} giochi disponibili
          </Typography>
          {catalog.hasFilters && (
            <Button size="small" onClick={catalog.resetFilters}>
              Azzera filtri
            </Button>
          )}
        </Stack>
        {catalog.games.length ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))',
                lg: 'repeat(3, minmax(0, 1fr))'
              },
              gap: 2
            }}
          >
            {catalog.games.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                favorite={favorites.includes(game.id)}
                onOpen={() => setSelectedGame(game)}
                onFavorite={() => onFavorite(game.id)}
              />
            ))}
          </Box>
        ) : (
          <EmptyState
            title={
              favoritesOnly && !catalog.hasFilters
                ? 'Nessun preferito salvato.'
                : 'Nessun gioco trovato.'
            }
            description={
              favoritesOnly && !catalog.hasFilters
                ? 'Usa il cuore nel catalogo per salvare un gioco.'
                : 'Prova un altro titolo o rimuovi i filtri.'
            }
            onReset={catalog.hasFilters ? catalog.resetFilters : undefined}
          />
        )}
      </Box>
      <Divider sx={{ mt: 4, mb: 2 }} />
      <Stack component="footer" direction="row" sx={{ justifyContent: 'space-between' }}>
        <Typography variant="caption" color="text.secondary">
          Build Inspector
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Catalogo dimostrativo
        </Typography>
      </Stack>
      <GameDetails
        game={selectedGame}
        favorite={!!selectedGame && favorites.includes(selectedGame.id)}
        onClose={() => setSelectedGame(null)}
        onFavorite={() => {
          if (selectedGame) onFavorite(selectedGame.id)
        }}
      />
    </>
  )
}
