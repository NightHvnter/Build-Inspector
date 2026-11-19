import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'
import type { JSX } from 'react'
import { Link } from 'react-router-dom'
import type { RequirementKind } from '@shared/types/steam'
import type { Game } from '../../games'
import { useGameRequirements } from '../../hooks/useGameRequirements'
import { useAuth } from '../../hooks/useAuth'
import { authLink } from '../../utils/authNavigation'
import { Icon } from '../Icon'
import { GameCover } from './GameCover'
import { FAVORITE_RED } from './GameCard'

const LABELS: Record<RequirementKind, string> = {
  os: 'Sistema operativo',
  cpu: 'Processore',
  ram: 'Memoria',
  gpu: 'Scheda video',
  storage: 'Archiviazione',
  directx: 'DirectX',
  other: 'Note'
}

function RequirementsSection({ game }: { game: Game }): JSX.Element {
  const steam = useGameRequirements(game.id)
  const rows = steam.requirements?.minimum ?? []

  return (
    <>
      <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
        Requisiti minimi
      </Typography>
      {steam.loading && (
        <Stack spacing={0.5} sx={{ mb: 1 }} role="status">
          <LinearProgress aria-label="Caricamento" />
          <Typography variant="caption" color="text.secondary">
            Carico i requisiti da Steam…
          </Typography>
        </Stack>
      )}
      {steam.error && (
        <Alert severity="warning" sx={{ mb: 1 }}>
          {steam.error}
        </Alert>
      )}
      {!steam.loading && !steam.error && rows.length === 0 && (
        <Alert severity="info" sx={{ mb: 1 }}>
          Steam non indica requisiti minimi per questo gioco.
        </Alert>
      )}
      {rows.length > 0 && (
        <Table size="small" aria-label="Requisiti minimi del gioco">
          <TableHead>
            <TableRow>
              <TableCell>Componente</TableCell>
              <TableCell>Minimo richiesto</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={index}>
                <TableCell component="th" scope="row" sx={{ whiteSpace: 'nowrap' }}>
                  {row.label || LABELS[row.kind]}
                </TableCell>
                <TableCell>{row.value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
        Requisiti da Steam. Con “Confronta con il mio PC” vedi come se la cava il tuo computer.
      </Typography>
    </>
  )
}

// The comparison page needs an account: guests are sent to log in, then on to the page.
function CompareButton({ game, onClose }: { game: Game; onClose: () => void }): JSX.Element | null {
  const { user } = useAuth()
  const page = '/confronto/' + game.id
  return (
    <Button
      component={Link}
      to={user ? page : authLink('/login', page)}
      onClick={onClose}
      variant="contained"
      startIcon={user ? undefined : <Icon name="lock" size={16} />}
    >
      {user ? 'Confronta con il mio PC' : 'Accedi per confrontare'}
    </Button>
  )
}

export function GameDetails({
  game,
  favorite,
  onClose,
  onFavorite
}: {
  game: Game | null
  favorite: boolean
  onClose: () => void
  onFavorite: () => void
}): JSX.Element {
  return (
    <Dialog open={!!game} onClose={onClose} fullWidth maxWidth="md" aria-labelledby="game-title">
      {game && (
        <>
          <DialogTitle id="game-title" sx={{ pr: 7 }}>
            {game.title}
            <IconButton
              onClick={onClose}
              aria-label="Chiudi dettagli gioco"
              sx={{ position: 'absolute', right: 10, top: 10 }}
            >
              <Icon name="close" />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <GameCover key={'cover-' + game.id} game={game} />
            <Typography sx={{ my: 2 }}>{game.description}</Typography>
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
              {game.genre.map((genre) => (
                <Chip key={genre} label={genre} size="small" variant="outlined" />
              ))}
            </Stack>
            <RequirementsSection key={'requirements-' + game.id} game={game} />
          </DialogContent>
          <DialogActions sx={{ p: 2, flexWrap: 'wrap', gap: 1 }}>
            <Button
              color="inherit"
              onClick={onFavorite}
              aria-pressed={favorite}
              startIcon={
                <Box
                  component="span"
                  sx={{ display: 'flex', color: favorite ? FAVORITE_RED : 'inherit' }}
                >
                  <Icon name="heart" size={18} filled={favorite} />
                </Box>
              }
            >
              {favorite ? 'Rimuovi dai preferiti' : 'Salva nei preferiti'}
            </Button>
            <Button component={Link} to="/configurazione" onClick={onClose} variant="outlined">
              Configura il mio PC
            </Button>
            <CompareButton game={game} onClose={onClose} />
          </DialogActions>
        </>
      )}
    </Dialog>
  )
}
