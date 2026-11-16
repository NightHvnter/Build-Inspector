import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography
} from '@mui/material'
import { useState, type JSX } from 'react'
import { Link } from 'react-router-dom'
import type { HistoryEntry } from '../../shared/history'
import { useHistory } from './hooks/useHistory'
import { EmptyState } from './components/common/EmptyState'
import { Icon } from './components/Icon'

const DATE = new Intl.DateTimeFormat('it-IT', { dateStyle: 'medium', timeStyle: 'short' })

function Outcome({ entry }: { entry: HistoryEntry }): JSX.Element {
  const outcome = entry.failed
    ? { label: 'Insufficiente', color: 'error' as const }
    : entry.toCheck
      ? { label: 'Da verificare', color: 'warning' as const }
      : { label: 'Soddisfatto', color: 'success' as const }
  return (
    <>
      <Chip size="small" variant="outlined" color={outcome.color} label={outcome.label} />
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
        {[
          entry.met && `${entry.met} soddisfatti`,
          entry.failed && `${entry.failed} insufficienti`,
          entry.toCheck && `${entry.toCheck} da verificare`
        ]
          .filter(Boolean)
          .join(' · ')}
      </Typography>
    </>
  )
}

// /cronologia: the comparisons the signed-in user made, newest first.
export function HistoryPage(): JSX.Element {
  const { entries, loading, error, busy, remove, clear, reload } = useHistory()
  const [confirmClear, setConfirmClear] = useState(false)

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 3 }}
      >
        <Box>
          <Typography component="h1" variant="h4" gutterBottom>
            Cronologia
          </Typography>
          <Typography color="text.secondary">
            I confronti tra i requisiti dei giochi e il tuo PC, dal più recente.
          </Typography>
        </Box>
        {entries.length > 0 && (
          <Button color="error" onClick={() => setConfirmClear(true)} disabled={busy}>
            Cancella cronologia
          </Button>
        )}
      </Stack>

      {loading && <LinearProgress aria-label="Carico la cronologia" sx={{ mb: 2 }} />}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            window.api?.history && (
              <Button color="inherit" size="small" onClick={reload}>
                Riprova
              </Button>
            )
          }
        >
          {error}
        </Alert>
      )}

      {!loading && !error && entries.length === 0 && (
        <EmptyState
          title="Nessun confronto salvato."
          description="Apri un gioco nella libreria e usa “Confronta con il mio PC”: il risultato comparirà qui."
        />
      )}

      {entries.length > 0 && (
        <TableContainer component={Paper} variant="outlined">
          <Table aria-label="Cronologia dei confronti" sx={{ minWidth: 720 }}>
            <TableHead>
              <TableRow>
                {['Data', 'Gioco', 'Componenti confrontati', 'Esito', ''].map((label) => (
                  <TableCell key={label}>{label}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {DATE.format(new Date(entry.date))}
                  </TableCell>
                  <TableCell component="th" scope="row">
                    {entry.gameName}
                  </TableCell>
                  <TableCell>
                    {[entry.cpuName, entry.gpuName, entry.ramGb && entry.ramGb + ' GB']
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </TableCell>
                  <TableCell>
                    <Outcome entry={entry} />
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <Button
                      component={Link}
                      to={'/confronto/' + entry.appId}
                      size="small"
                      aria-label={'Confronta di nuovo ' + entry.gameName}
                    >
                      Confronta di nuovo
                    </Button>
                    <Tooltip title="Elimina">
                      <IconButton
                        size="small"
                        onClick={() => remove(entry.id)}
                        disabled={busy}
                        aria-label={'Elimina ' + entry.gameName + ' dalla cronologia'}
                      >
                        <Icon name="close" size={18} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={confirmClear} onClose={() => setConfirmClear(false)}>
        <DialogTitle>Cancellare la cronologia?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tutti i confronti salvati verranno eliminati. Non si può annullare.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmClear(false)}>Annulla</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              setConfirmClear(false)
              clear()
            }}
          >
            Cancella tutto
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
