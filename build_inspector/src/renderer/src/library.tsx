import { useState, type JSX } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Divider,
  Paper,
  Skeleton,
  Stack,
  Typography
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import type { Game } from './games'
import { useAuth } from './hooks/useAuth'
import { useCatalog } from './hooks/useCatalog'
import { useFavorites } from './hooks/useFavorites'
import { GameCard } from './components/catalog/GameCard'
import { GameDetails } from './components/catalog/GameDetails'
import { GameFilters } from './components/catalog/GameFilters'
import { EmptyState } from './components/common/EmptyState'

const GRID = {
  display: 'grid',
  gridTemplateColumns: {
    xs: '1fr',
    sm: 'repeat(2, minmax(0, 1fr))',
    lg: 'repeat(3, minmax(0, 1fr))'
  },
  gap: 2
} as const

// Stand-ins shown while Steam is being searched, shaped like the game cards.
function CardSkeleton(): JSX.Element {
  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }} aria-hidden>
      <Skeleton variant="rectangular" sx={{ aspectRatio: '460 / 215', height: 'auto' }} />
      <Box sx={{ p: 2 }}>
        <Skeleton width="40%" />
        <Skeleton width="75%" height={32} />
        <Skeleton width="90%" />
      </Box>
    </Card>
  )
}

function SectionTitle({ title, count }: { title: string; count?: number }): JSX.Element {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', mb: 1.5 }}>
      <Typography component="h2" variant="h6">
        {title}
      </Typography>
      {count !== undefined && (
        <Typography variant="body2" color="text.secondary">
          {count}
        </Typography>
      )}
    </Stack>
  )
}

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
  const cards = (games: Game[]): JSX.Element[] =>
    games.map((game) => (
      <GameCard
        key={game.id}
        game={game}
        favorite={favorites.includes(game.id)}
        onOpen={() => setSelectedGame(game)}
        onFavorite={() => onFavorite(game.id)}
      />
    ))

  const searching = !!catalog.search.trim()
  // With a search, featured matches and Steam's results get their own sections.
  const split = searching && !favoritesOnly
  const total = catalog.games.length
  const genreFilter = catalog.genre !== catalog.genres[0] ? catalog.genre : null
  const featuredTitle = catalog.fromChart ? 'Più giocati della settimana' : 'In evidenza'

  return (
    <>
      <Box component="section" aria-labelledby="catalog-title">
        <Box sx={{ mb: 2.5 }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 0.5 }}>
            <Typography id="catalog-title" component="h1" variant="h4">
              {favoritesOnly ? 'I tuoi preferiti' : 'Catalogo giochi'}
            </Typography>
            <Chip
              size="small"
              label={favoritesOnly ? favorites.length : catalog.catalogSize}
              aria-label={
                (favoritesOnly ? favorites.length : catalog.catalogSize) +
                (favoritesOnly ? ' preferiti' : ' giochi in catalogo')
              }
              sx={{ fontWeight: 600 }}
            />
          </Stack>
          <Typography color="text.secondary" variant="body2">
            {favoritesOnly
              ? 'I giochi che hai salvato con il cuore.'
              : catalog.fromChart
                ? 'I giochi più giocati su Steam negli ultimi 7 giorni. Cerca qualsiasi altro gioco Steam, o aprine uno per vederne i requisiti.'
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
          spacing={1}
          useFlexGap
          sx={{ alignItems: 'center', flexWrap: 'wrap', minHeight: 40, my: 2 }}
        >
          <Typography variant="body2" color="text.secondary" role="status" sx={{ mr: 0.5 }}>
            {total === 1 ? '1 gioco' : `${total} giochi`}
            {catalog.steamLoading && ' · Cerco su Steam…'}
          </Typography>
          {searching && (
            <Chip
              size="small"
              label={`“${catalog.search.trim()}”`}
              onDelete={() => catalog.updateFilters({ q: '' })}
              aria-label={`Ricerca: ${catalog.search.trim()}`}
            />
          )}
          {genreFilter && (
            <Chip
              size="small"
              label={genreFilter}
              onDelete={() => catalog.updateFilters({ genre: '' })}
              aria-label={`Genere: ${genreFilter}`}
            />
          )}
          {catalog.hasFilters && (
            <Button size="small" onClick={catalog.resetFilters} sx={{ ml: 'auto' }}>
              Azzera filtri
            </Button>
          )}
        </Stack>

        {total === 0 && !catalog.steamLoading && !catalog.featuredLoading ? (
          <EmptyState
            icon={favoritesOnly && !catalog.hasFilters ? 'heart' : 'search'}
            title={
              favoritesOnly && !catalog.hasFilters
                ? 'Nessun preferito salvato.'
                : 'Nessun gioco trovato.'
            }
            description={
              favoritesOnly && !catalog.hasFilters
                ? 'Usa il cuore nel catalogo per salvare un gioco.'
                : genreFilter
                  ? 'Nessun gioco in evidenza di questo genere. Prova un altro genere o cerca un titolo.'
                  : 'Prova con un altro titolo: la ricerca include tutti i giochi Steam.'
            }
            onReset={catalog.hasFilters ? catalog.resetFilters : undefined}
          />
        ) : split ? (
          <Stack spacing={4}>
            {catalog.featured.length > 0 && (
              <Box component="section" aria-label={featuredTitle}>
                <SectionTitle title={featuredTitle} count={catalog.featured.length} />
                <Box sx={GRID}>{cards(catalog.featured)}</Box>
              </Box>
            )}
            {(catalog.steamResults.length > 0 || catalog.steamLoading) && (
              <Box
                component="section"
                aria-label="Risultati da Steam"
                aria-busy={catalog.steamLoading}
              >
                <SectionTitle
                  title="Risultati da Steam"
                  count={catalog.steamLoading ? undefined : catalog.steamResults.length}
                />
                <Box sx={GRID}>
                  {catalog.steamLoading
                    ? [0, 1, 2].map((key) => <CardSkeleton key={key} />)
                    : cards(catalog.steamResults)}
                </Box>
              </Box>
            )}
          </Stack>
        ) : (
          <Box sx={GRID} aria-busy={catalog.featuredLoading}>
            {catalog.featuredLoading
              ? [0, 1, 2, 3, 4, 5].map((key) => <CardSkeleton key={key} />)
              : cards(catalog.games)}
          </Box>
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
