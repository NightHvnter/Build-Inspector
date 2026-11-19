import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  alpha
} from '@mui/material'
import { useEffect, useMemo, useRef, useState, type JSX, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { RequirementKind } from '@shared/types/steam'
import {
  compareWithPc,
  historyRecord,
  summarize,
  weakestRow,
  type ComparisonRow,
  type Verdict
} from './data/compare'
import { useGameRequirements } from './hooks/useGameRequirements'
import { useHardwareCatalog } from './hooks/useHardwareCatalog'
import { usePcScan } from './hooks/usePcScan'
import { useMyBuild } from './hooks/useMyBuild'
import { steamCover } from './hooks/useSteamSearch'
import { Icon } from './components/Icon'
import { UpgradeAdvice } from './components/compare/UpgradeAdvice'
import { suggestUpgrades } from './data/upgrades'

type Tone = 'success' | 'error' | 'warning'

const VERDICTS: Record<Verdict, { label: string; color: Tone } | null> = {
  ok: { label: 'Soddisfatto', color: 'success' },
  low: { label: 'Insufficiente', color: 'error' },
  check: { label: 'Da verificare', color: 'warning' },
  info: null
}

const KIND_ICONS: Record<RequirementKind, Parameters<typeof Icon>[0]['name']> = {
  os: 'grid',
  cpu: 'chip',
  ram: 'bolt',
  gpu: 'monitor',
  storage: 'save',
  directx: 'game',
  other: 'info'
}

// The quality meter runs from 0 to twice the requirement, so the minimum sits in the middle.
const METER_MAX = 200

// How far above (or below) the minimum a part is, in words.
function qualityTier(score: number): { label: string; color: Tone } {
  if (score < 100) return { label: 'Sotto il minimo', color: 'error' }
  if (score < 130) return { label: 'Al limite', color: 'warning' }
  if (score < 200) return { label: 'Buono', color: 'success' }
  return { label: 'Eccellente', color: 'success' }
}

function parseAppId(value: string | undefined): number | null {
  const id = Number(value)
  return /^\d{1,10}$/.test(value ?? '') && Number.isSafeInteger(id) && id > 0 ? id : null
}

function formatScanDate(value: string | undefined): string | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleString('it-IT', { dateStyle: 'medium', timeStyle: 'short' })
}

// /confronto/:appId: a game's minimum requirements from Steam next to this PC's scan.
export function CompareGame(): JSX.Element {
  const appId = parseAppId(useParams().appId)
  const steam = useGameRequirements(appId)
  const scan = usePcScan(appId !== null)
  const hardware = useHardwareCatalog()
  const requirements = steam.requirements
  // "La mia build": parts chosen by hand stay as saved, the others come from the scan.
  const myBuild = useMyBuild(scan.pc, hardware.catalog)
  const rows = useMemo(
    () =>
      requirements && scan.pc
        ? compareWithPc(requirements, scan.pc, hardware.catalog, myBuild)
        : [],
    [requirements, scan.pc, hardware.catalog, myBuild]
  )
  const totals = summarize(rows)
  const weakest = weakestRow(rows)
  // What to change, and with which parts, for every component that isn't green.
  const upgrades = useMemo(
    () =>
      requirements && scan.pc
        ? suggestUpgrades(rows, requirements, scan.pc, hardware.catalog, myBuild)
        : [],
    [rows, requirements, scan.pc, hardware.catalog, myBuild]
  )
  const loading = steam.loading || scan.scanning || hardware.loading

  // Save each finished comparison once per visit of this page (a new scan counts as a new
  // one): testing the same game again adds another entry to the history.
  const [historyError, setHistoryError] = useState<string | null>(null)
  const recorded = useRef<string | null>(null)
  const pc = scan.pc
  const catalog = hardware.catalog
  useEffect(() => {
    const history = window.api?.history
    if (!history || loading || !requirements || !pc || !rows.length) return
    const key = requirements.appId + '@' + pc.scannedAt
    if (recorded.current === key) return
    recorded.current = key
    history
      .record(historyRecord(requirements, pc, catalog, rows, myBuild))
      .then((reply) => setHistoryError(reply.ok ? null : reply.message))
      .catch(() => setHistoryError('Cronologia non disponibile.'))
  }, [loading, requirements, pc, catalog, rows, myBuild])

  if (appId === null)
    return (
      <Box>
        <Alert severity="error">Gioco non valido.</Alert>
        <Button component={Link} to="/home" sx={{ mt: 2 }}>
          Torna ai giochi
        </Button>
      </Box>
    )

  const ready = rows.length > 0 && !loading
  const decided = totals.ok + totals.low + totals.check
  const metPercent = decided ? Math.round((totals.ok / decided) * 100) : 0
  const overall: { tone: Tone; title: string; text: string } = totals.low
    ? {
        tone: 'error',
        title: 'Il tuo PC non raggiunge i requisiti minimi',
        text: 'Almeno un componente è sotto il minimo indicato da Steam.'
      }
    : totals.check
      ? {
          tone: 'warning',
          title: 'Il tuo PC raggiunge i requisiti verificati',
          text: 'Alcuni requisiti non si possono verificare in automatico: controllali a mano.'
        }
      : {
          tone: 'success',
          title: 'Il tuo PC raggiunge i requisiti minimi',
          text: 'Tutti i componenti misurati sono pari o superiori al minimo richiesto.'
        }
  const scannedAt = formatScanDate(pc?.scannedAt)

  return (
    <Box sx={{ maxWidth: 1200 }}>
      <Button component={Link} to="/home" startIcon={<Icon name="back" size={18} />} sx={{ mb: 2 }}>
        Giochi
      </Button>

      {/* Header: the game, the overall verdict and how many requirements are met. */}
      <Paper variant="outlined" sx={{ overflow: 'hidden', mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }}>
          <Box
            component="img"
            src={steamCover(appId)}
            alt=""
            sx={{
              width: { xs: '100%', md: 300 },
              aspectRatio: '460 / 215',
              objectFit: 'cover',
              flexShrink: 0,
              display: 'block',
              alignSelf: { md: 'center' }
            }}
          />
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={3}
            sx={{ p: 3, flex: 1, alignItems: { sm: 'center' } }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ letterSpacing: 1.2, lineHeight: 1.6 }}
              >
                Report di compatibilità
              </Typography>
              <Typography component="h1" variant="h4" sx={{ mb: 0.5 }}>
                {requirements?.name || 'Confronto con il tuo PC'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Requisiti minimi Steam
                {scannedAt ? ` · Scansione del ${scannedAt}` : ''}
              </Typography>
              {ready && (
                <Stack direction="row" spacing={1.25} sx={{ mt: 2, alignItems: 'flex-start' }}>
                  <Box
                    sx={{
                      mt: 0.25,
                      color: `${overall.tone}.main`,
                      display: 'flex',
                      flexShrink: 0
                    }}
                  >
                    <Icon name={overall.tone === 'success' ? 'check' : 'info'} size={20} />
                  </Box>
                  <Box role="status">
                    <Typography sx={{ fontWeight: 600, color: `${overall.tone}.main` }}>
                      {overall.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {overall.text}
                    </Typography>
                  </Box>
                </Stack>
              )}
            </Box>
            <Stack spacing={1.5} sx={{ alignItems: { xs: 'flex-start', sm: 'center' } }}>
              {ready && (
                <ScoreRing value={metPercent} tone={overall.tone} label="requisiti soddisfatti" />
              )}
              <Button
                variant="outlined"
                size="small"
                onClick={scan.rescan}
                disabled={scan.scanning || !window.api?.scanner}
                startIcon={<Icon name="chip" size={16} />}
              >
                Scansiona di nuovo
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </Paper>

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

      {ready && (
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
            mb: 3
          }}
        >
          <StatTile label="Soddisfatti" value={totals.ok} tone="success" />
          <StatTile label="Insufficienti" value={totals.low} tone="error" />
          <StatTile label="Da verificare" value={totals.check} tone="warning" />
          <StatTile
            label="Componente più debole"
            value={weakest ? `${weakest.score}%` : '—'}
            tone={weakest ? qualityTier(weakest.score ?? 0).color : undefined}
            caption={weakest ? `${weakest.label} rispetto al minimo` : 'Nessun valore misurabile'}
          />
        </Box>
      )}

      {rows.length > 0 && (
        <>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-end' }, mb: 1.5 }}
            spacing={1}
          >
            <Box>
              <Typography component="h2" variant="h6">
                Analisi per componente
              </Typography>
              <Typography variant="body2" color="text.secondary">
                La qualità indica quanto il tuo componente supera il requisito minimo (100% = pari
                al minimo).
              </Typography>
            </Box>
            <MeterLegend />
          </Stack>
          {rows.some((row) => row.manual) && (
            <Alert
              severity="info"
              sx={{ mb: 1.5 }}
              action={
                <Button component={Link} to="/configurazione" color="inherit" size="small">
                  La mia build
                </Button>
              }
            >
              Alcuni componenti vengono da “La mia build”, dove li hai scelti a mano: la scansione
              non li sostituisce.
            </Alert>
          )}
          <TableContainer component={Paper} variant="outlined">
            <Table aria-label="Requisiti minimi e componenti del tuo PC" sx={{ minWidth: 860 }}>
              <TableHead>
                <TableRow
                  sx={{
                    '& th': {
                      fontSize: 12,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: 0.6,
                      color: 'text.secondary',
                      bgcolor: (t) => alpha(t.palette.text.primary, 0.03)
                    }
                  }}
                >
                  <TableCell>Componente</TableCell>
                  <TableCell>Minimo richiesto</TableCell>
                  <TableCell>Il tuo PC</TableCell>
                  <TableCell sx={{ width: 240 }}>Qualità rispetto al requisito</TableCell>
                  <TableCell sx={{ width: 150 }}>Esito</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, index) => (
                  <ComparisonTableRow key={index} row={row} />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {!loading && <UpgradeAdvice upgrades={upgrades} />}

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
        Processore e scheda video sono confrontati con i punteggi PassMark del database; memoria,
        memoria video e spazio libero con i GB richiesti. Le percentuali sono una stima, non una
        garanzia di prestazioni.
      </Typography>
      {historyError && (
        <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 1 }}>
          Confronto non salvato nella cronologia: {historyError}
        </Typography>
      )}
    </Box>
  )
}

function ComparisonTableRow({ row }: { row: ComparisonRow }): JSX.Element {
  const verdict = VERDICTS[row.verdict]
  return (
    <TableRow sx={{ '&:last-child td, &:last-child th': { borderBottom: 0 } }}>
      <TableCell component="th" scope="row" sx={{ whiteSpace: 'nowrap' }}>
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1,
              display: 'grid',
              placeItems: 'center',
              color: 'primary.main',
              bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
              flexShrink: 0
            }}
          >
            <Icon name={KIND_ICONS[row.kind]} size={18} />
          </Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {row.label}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="text.secondary">
          {row.required}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {row.yours}
        </Typography>
        {row.manual && (
          <Chip size="small" variant="outlined" label="Scelto a mano" sx={{ mt: 0.5 }} />
        )}
      </TableCell>
      <TableCell>
        {row.score !== null ? (
          <QualityMeter score={row.score} label={row.label} />
        ) : (
          // The system is either the right one or not: there is no percentage to show.
          row.verdict !== 'info' &&
          row.kind !== 'os' && (
            <Typography variant="caption" color="text.secondary">
              Non misurabile
            </Typography>
          )
        )}
      </TableCell>
      <TableCell>
        {verdict && (
          <Chip size="small" color={verdict.color} variant="outlined" label={verdict.label} />
        )}
        {row.detail && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 0.75, lineHeight: 1.35 }}
          >
            {row.detail}
          </Typography>
        )}
      </TableCell>
    </TableRow>
  )
}

// A bar from 0 to twice the requirement, with a tick at the requirement itself.
function QualityMeter({ score, label }: { score: number; label: string }): JSX.Element {
  const tier = qualityTier(score)
  const fill = (Math.min(score, METER_MAX) / METER_MAX) * 100
  return (
    <Box>
      <Stack direction="row" sx={{ alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 700, color: `${tier.color}.main`, fontVariantNumeric: 'tabular-nums' }}
        >
          {score.toLocaleString('it-IT')}%
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {tier.label}
        </Typography>
      </Stack>
      <Box sx={{ position: 'relative', mt: 0.5 }}>
        <LinearProgress
          variant="determinate"
          value={fill}
          color={tier.color}
          aria-label={`Qualità ${label}: ${score}% del requisito minimo`}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: (t) => alpha(t.palette.text.primary, 0.08),
            '& .MuiLinearProgress-bar': { borderRadius: 4 }
          }}
        />
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            left: `${(100 / METER_MAX) * 100}%`,
            top: -3,
            bottom: -3,
            width: 2,
            borderRadius: 1,
            bgcolor: 'text.primary',
            opacity: 0.55
          }}
        />
      </Box>
    </Box>
  )
}

function MeterLegend(): JSX.Element {
  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{ alignItems: 'center', color: 'text.secondary', flexShrink: 0 }}
    >
      <Box sx={{ width: 2, height: 12, bgcolor: 'text.primary', opacity: 0.55 }} />
      <Typography variant="caption">Requisito minimo (100%)</Typography>
      <Typography variant="caption" sx={{ pl: 1 }}>
        Scala fino al 200%
      </Typography>
    </Stack>
  )
}

function ScoreRing({
  value,
  tone,
  label
}: {
  value: number
  tone: Tone
  label: string
}): JSX.Element {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <CircularProgress
          variant="determinate"
          value={100}
          size={84}
          thickness={4}
          sx={{ color: (t) => alpha(t.palette.text.primary, 0.08), position: 'absolute' }}
          aria-hidden
        />
        <CircularProgress
          variant="determinate"
          value={value}
          size={84}
          thickness={4}
          color={tone}
          aria-label={`${value}% ${label}`}
        />
        <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
          <Typography
            variant="h6"
            component="span"
            sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
          >
            {value}%
          </Typography>
        </Box>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 90, lineHeight: 1.3 }}>
        {label}
      </Typography>
    </Stack>
  )
}

function StatTile({
  label,
  value,
  tone,
  caption
}: {
  label: string
  value: ReactNode
  tone?: Tone
  caption?: string
}): JSX.Element {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderLeft: 3,
        borderLeftColor: tone ? `${tone}.main` : 'divider'
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography
        variant="h5"
        component="p"
        sx={{ fontVariantNumeric: 'tabular-nums', lineHeight: 1.3 }}
      >
        {value}
      </Typography>
      {caption && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          {caption}
        </Typography>
      )}
    </Paper>
  )
}
