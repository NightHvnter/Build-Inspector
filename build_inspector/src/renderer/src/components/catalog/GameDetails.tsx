import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography
} from '@mui/material'
import type { JSX } from 'react'
import { Link } from 'react-router-dom'
import type { Game } from '../../games'
import { Icon } from '../Icon'
import { GameCover } from './GameCover'

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
    <Dialog open={!!game} onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="game-title">
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
            <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
              Configurazione di riferimento
            </Typography>
            <Table size="small" aria-label="Requisiti del gioco">
              <TableBody>
                {[
                  ['CPU', game.reqCpu],
                  ['GPU', game.reqGpu],
                  ['RAM', game.reqRam + ' GB']
                ].map(([label, value]) => (
                  <TableRow key={label}>
                    <TableCell component="th" scope="row">
                      {label}
                    </TableCell>
                    <TableCell>{value}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
              Dati dimostrativi: verifica i requisiti ufficiali prima di acquistare un gioco.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2, flexWrap: 'wrap', gap: 1 }}>
            <Button color="inherit" onClick={onFavorite}>
              {favorite ? 'Rimuovi dai preferiti' : 'Salva nei preferiti'}
            </Button>
            <Button component={Link} to="/configurazione" onClick={onClose} variant="contained">
              Configura il mio PC
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  )
}
