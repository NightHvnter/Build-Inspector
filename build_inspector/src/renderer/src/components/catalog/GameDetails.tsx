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
import type { ScannedPc } from '@shared/types/scan'
import type { RequirementKind, RequirementRow } from '@shared/types/steam'
import type { Game } from '../../games'
import { steamAppId, useGameRequirements } from '../../hooks/useGameRequirements'
import { usePcScan } from '../../hooks/usePcScan'
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

// Only RAM can be checked reliably from Steam's text: CPU and GPU names need benchmarks.
function ramVerdict(minimumGb: number | null, pc: ScannedPc | null): JSX.Element | null {
  if (!minimumGb || !pc?.ram.totalGb) return null
  const enough = pc.ram.totalGb >= minimumGb
  return (
    <Chip
      size="small"
      color={enough ? 'success' : 'error'}
      label={enough ? 'Sufficiente' : 'Insufficiente'}
      sx={{ ml: 1 }}
    />
  )
}

// The catalog's own demo values, used when Steam has no requirements for the game.
function demoRows(game: Game): RequirementRow[] {
  return [
    { kind: 'cpu', label: 'Processore', value: game.reqCpu },
    { kind: 'gpu', label: 'Scheda video', value: game.reqGpu },
    { kind: 'ram', label: 'Memoria', value: game.reqRam ? game.reqRam + ' GB' : '' }
  ].filter((row): row is RequirementRow => !!row.value)
}

function RequirementsSection({ game }: { game: Game }): JSX.Element {
  const appId = steamAppId(game)
  const steam = useGameRequirements(appId)
  const scan = usePcScan(true)
  const fromSteam = !!steam.requirements?.minimum.length
  const rows =
    fromSteam && steam.requirements
      ? steam.requirements.minimum
      : steam.loading
        ? []
        : demoRows(game)
  const minimumRamGb = fromSteam ? (steam.requirements?.ramGb ?? null) : game.reqRam || null

  return (
    <>
      <Stack
        direction="row"
        sx={{ mt: 3, mb: 1, alignItems: 'center', justifyContent: 'space-between', gap: 1 }}
      >
        <Typography variant="h6">Requisiti minimi</Typography>
        <Button
          size="small"
          onClick={scan.rescan}
          disabled={scan.scanning || !window.api?.scanner}
          startIcon={<Icon name="chip" size={16} />}
        >
          Scansiona di nuovo
        </Button>
      </Stack>
      {(steam.loading || scan.scanning) && (
        <Stack spacing={0.5} sx={{ mb: 1 }} role="status">
          <LinearProgress aria-label="Caricamento" />
          <Typography variant="caption" color="text.secondary">
            {[
              steam.loading && 'Carico i requisiti da Steam…',
              scan.scanning && 'Scansiono il tuo PC…'
            ]
              .filter(Boolean)
              .join(' ')}
          </Typography>
        </Stack>
      )}
      {steam.error && (
        <Alert severity="warning" sx={{ mb: 1 }}>
          {steam.error}
          {rows.length > 0 && ' Mostro i dati dimostrativi del catalogo.'}
        </Alert>
      )}
      {!steam.loading && !steam.error && !fromSteam && rows.length === 0 && (
        <Alert severity="info" sx={{ mb: 1 }}>
          Steam non indica requisiti minimi per questo gioco.
        </Alert>
      )}
      {scan.error && (
        <Alert severity="error" sx={{ mb: 1 }}>
          {scan.error}
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
                <TableCell>
                  {row.value}
                  {row.kind === 'ram' && ramVerdict(minimumRamGb, scan.pc)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
        {fromSteam
          ? 'Requisiti da Steam. La RAM è confrontata con la scansione del tuo PC.'
          : 'Dati dimostrativi: verifica i requisiti ufficiali prima di acquistare un gioco.'}
      </Typography>
    </>
  )
}

// The comparison page needs an account: guests are sent to log in, then on to the page.
function CompareButton({ game, onClose }: { game: Game; onClose: () => void }): JSX.Element | null {
  const { user } = useAuth()
  const appId = steamAppId(game)
  if (appId === null) return null
  const page = '/confronto/' + appId
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
            <GameCover key={game.id} game={game} />
            <Typography sx={{ my: 2 }}>{game.description}</Typography>
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
              {game.genre.map((genre) => (
                <Chip key={genre} label={genre} size="small" variant="outlined" />
              ))}
            </Stack>
            <RequirementsSection key={game.id} game={game} />
          </DialogContent>
          <DialogActions sx={{ p: 2, flexWrap: 'wrap', gap: 1 }}>
            <Button
              color="inherit"
              onClick={onFavorite}
              aria-pressed={favorite}
              startIcon={
                <Box component="span" sx={{ display: 'flex', color: favorite ? FAVORITE_RED : 'inherit' }}>
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
