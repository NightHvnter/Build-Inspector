import { useState, type JSX } from 'react'
import { Alert, Box, Button, Chip, Divider, Paper, Stack, Typography } from '@mui/material'
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
        <Box sx={{ mb: 2.5 }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 0.5 }}>
            <Typography id="catalog-title" component={favoritesOnly ? 'h1' : 'h2'} variant="h5">
              {favoritesOnly ? 'I tuoi preferiti' : 'Catalogo giochi'}
            </Typography>
            <Chip
              size="small"
              label={favoritesOnly ? favorites.length : STEAM_GAMES.length}
              aria-label={
                (favoritesOnly ? favorites.length : STEAM_GAMES.length) +
                (favoritesOnly ? ' preferiti' : ' giochi in catalogo')
              }
              sx={{ fontWeight: 600 }}
            />
          </Stack>
          <Typography color="text.secondary" variant="body2">
            {favoritesOnly
              ? 'I giochi che hai salvato con il cuore.'
              : 'Cerca qualsiasi gioco Steam, o scegli tra quelli in evidenza. Apri un gioco per vederne i requisiti.'}
          </Typography>
        </Box>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {catalog.steamError && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {catalog.steamError}
          </Alert>
        )}
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <GameFilters
            search={catalog.search}
            genre={catalog.genre}
            genres={catalog.genres}
            sort={catalog.sort}
            onChange={catalog.updateFilters}
          />
        </Paper>
        <Stack
          direction="row"
          spacing={2}
          sx={{ alignItems: 'center', justifyContent: 'space-between', minHeight: 40, my: 1.5 }}
        >
          <Typography variant="body2" color="text.secondary" role="status">
            {catalog.games.length === 1 ? '1 gioco' : `${catalog.games.length} giochi`}
            {catalog.steamLoading && ' · Cerco su Steam…'}
          </Typography>
          {catalog.hasFilters && (
            <Button size="small" onClick={catalog.resetFilters}>
              Azzera filtri
            </Button>
          )}
        </Stack>
        {catalog.games.length || catalog.steamLoading ? (
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
      <Divider sx={{ mt: 6, mb: 2 }} />
      <Stack
        component="footer"
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        sx={{ justifyContent: 'space-between' }}
      >
        <Typography variant="caption" color="text.secondary">
          © {new Date().getFullYear()} Build Inspector
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Requisiti dei giochi da Steam · Punteggi dei componenti da PassMark. Sono stime, non
          garanzie di prestazioni.
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
