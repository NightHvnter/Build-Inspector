import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'
import { useMemo, type JSX } from 'react'
import { Link, useParams } from 'react-router-dom'
import { compareWithPc, summarize, type Verdict } from './data/compare'
import { useGameRequirements } from './hooks/useGameRequirements'
import { useHardwareCatalog } from './hooks/useHardwareCatalog'
import { usePcScan } from './hooks/usePcScan'
import { steamCover } from './hooks/useSteamSearch'
import { Icon } from './components/Icon'

const VERDICTS: Record<Verdict, { label: string; color: 'success' | 'error' | 'warning' } | null> =
  {
    ok: { label: 'Soddisfatto', color: 'success' },
    low: { label: 'Insufficiente', color: 'error' },
    check: { label: 'Da verificare', color: 'warning' },
    info: null
  }

function parseAppId(value: string | undefined): number | null {
  const id = Number(value)
  return /^\d{1,10}$/.test(value ?? '') && Number.isSafeInteger(id) && id > 0 ? id : null
}

// /confronto/:appId: a game's minimum requirements from Steam next to this PC's scan.
export function CompareGame(): JSX.Element {
  const appId = parseAppId(useParams().appId)
  const steam = useGameRequirements(appId)
  const scan = usePcScan(appId !== null)
  const hardware = useHardwareCatalog()
  const requirements = steam.requirements
  const rows = useMemo(
    () => (requirements && scan.pc ? compareWithPc(requirements, scan.pc, hardware.catalog) : []),
    [requirements, scan.pc, hardware.catalog]
  )
  const totals = summarize(rows)
  const loading = steam.loading || scan.scanning || hardware.loading

  if (appId === null)
    return (
      <Box>
        <Alert severity="error">Gioco non valido.</Alert>
        <Button component={Link} to="/libreria" sx={{ mt: 2 }}>
          Torna alla libreria
        </Button>
      </Box>
    )

  return (
    <Box>
      <Button
        component={Link}
        to="/libreria"
        startIcon={<Icon name="back" size={18} />}
        sx={{ mb: 2 }}
      >
        Libreria
      </Button>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={3}
        sx={{ alignItems: { md: 'center' }, mb: 3 }}
      >
        <Box
          component="img"
          src={steamCover(appId)}
          alt=""
          sx={{ width: { xs: '100%', md: 280 }, borderRadius: 1, flexShrink: 0 }}
        />
        <Box sx={{ flex: 1 }}>
          <Typography component="h1" variant="h4" gutterBottom>
            {requirements?.name || 'Confronto con il tuo PC'}
          </Typography>
          <Typography color="text.secondary">
            Requisiti minimi da Steam confrontati con i componenti rilevati su questo PC.
          </Typography>
        </Box>
        <Button
          onClick={scan.rescan}
          disabled={scan.scanning || !window.api?.scanner}
          startIcon={<Icon name="chip" size={16} />}
          sx={{ flexShrink: 0, alignSelf: { xs: 'flex-start', md: 'center' } }}
        >
          Scansiona di nuovo
        </Button>
      </Stack>

      {loading && (
        <Stack spacing={0.5} sx={{ mb: 2 }} role="status">
          <LinearProgress aria-label="Caricamento" />
          <Typography variant="caption" color="text.secondary">
            {[
              steam.loading && 'Carico i requisiti da Steam…',
              scan.scanning && 'Scansiono il tuo PC…',
              hardware.loading && 'Carico i punteggi dei componenti…'
            ]
              .filter(Boolean)
              .join(' ')}
          </Typography>
        </Stack>
      )}
      {steam.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {steam.error}
        </Alert>
      )}
      {scan.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {scan.error}
        </Alert>
      )}
      {hardware.error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {hardware.error} Processore e scheda video vanno confrontati a mano.
        </Alert>
      )}
      {requirements && !requirements.minimum.length && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Steam non indica requisiti minimi per questo gioco.
        </Alert>
      )}

      {rows.length > 0 && !loading && (
        <Alert
          severity={totals.low ? 'error' : totals.check ? 'warning' : 'success'}
          sx={{ mb: 2 }}
        >
          <AlertTitle>
            {totals.low
              ? 'Il tuo PC non raggiunge i requisiti minimi'
              : totals.check
                ? 'Il tuo PC raggiunge i requisiti verificati'
                : 'Il tuo PC raggiunge i requisiti minimi'}
          </AlertTitle>
          {[
            totals.ok && `${totals.ok} soddisfatti`,
            totals.low && `${totals.low} insufficienti`,
            totals.check && `${totals.check} da verificare a mano`
          ]
            .filter(Boolean)
            .join(' · ')}
        </Alert>
      )}

      {rows.length > 0 && (
        <TableContainer component={Paper} variant="outlined">
          <Table aria-label="Requisiti minimi e componenti del tuo PC" sx={{ minWidth: 720 }}>
            <TableHead>
              <TableRow>
                {['Componente', 'Minimo richiesto', 'Il tuo PC', 'Esito'].map((label) => (
                  <TableCell key={label}>{label}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, index) => {
                const verdict = VERDICTS[row.verdict]
                return (
                  <TableRow key={index}>
                    <TableCell component="th" scope="row" sx={{ whiteSpace: 'nowrap' }}>
                      {row.label}
                    </TableCell>
                    <TableCell>{row.required}</TableCell>
                    <TableCell>{row.yours}</TableCell>
                    <TableCell sx={{ minWidth: 200 }}>
                      {verdict && (
                        <Chip
                          size="small"
                          color={verdict.color}
                          variant="outlined"
                          label={verdict.label}
                        />
                      )}
                      {row.detail && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', mt: 0.5 }}
                        >
                          {row.detail}
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
        Processore e scheda video sono confrontati con i punteggi PassMark del database: è una
        stima, non una garanzia di prestazioni.
      </Typography>
    </Box>
  )
}
