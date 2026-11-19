import { useEffect, useState, type JSX } from 'react'
import { Alert, Box, Button, Chip, Paper, Stack, TextField, Typography } from '@mui/material'
import { normalizeServerUrl, type ServerSettings } from '../../shared/server'
import { Icon } from './components/Icon'

const SOURCES: Record<ServerSettings['source'], string> = {
  env: 'dalla variabile BUILD_INSPECTOR_API_URL',
  saved: 'salvato nelle impostazioni',
  default: 'predefinito (questo computer)'
}

type Status = { severity: 'success' | 'error' | 'info'; text: string } | null

// /impostazioni: which Build Inspector server the app talks to.
export function SettingsPage(): JSX.Element {
  const server = window.api?.server
  const [current, setCurrent] = useState<ServerSettings | null>(null)
  const [value, setValue] = useState('')
  const [status, setStatus] = useState<Status>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!server) return
    let cancelled = false
    server
      .get()
      .then((settings) => {
        if (cancelled || !settings) return
        setCurrent(settings)
        setValue(settings.url)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [server])

  const normalized = normalizeServerUrl(value)
  const fromEnv = current?.source === 'env'
  const unchanged = normalized === current?.url

  const run = async (
    action: () => Promise<{ ok: boolean; message?: string }>,
    done: string
  ): Promise<void> => {
    setBusy(true)
    setStatus(null)
    try {
      const reply = await action()
      setStatus(
        reply.ok
          ? { severity: 'success', text: done }
          : { severity: 'error', text: reply.message ?? 'Operazione non riuscita.' }
      )
    } catch {
      setStatus({ severity: 'error', text: 'Operazione non riuscita.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Box sx={{ maxWidth: 760 }}>
      <Typography component="h1" variant="h4" gutterBottom>
        Impostazioni
      </Typography>
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1 }}>
          <Icon name="monitor" />
          <Typography component="h2" variant="h6">
            Indirizzo del server
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Il server Build Inspector a cui l’app chiede giochi, account e cronologia. Se qualcuno ti
          ha dato un indirizzo (per esempio https://….trycloudflare.com), incollalo qui.
        </Typography>

        {!server ? (
          <Alert severity="info">Le impostazioni sono disponibili solo nell’app desktop.</Alert>
        ) : (
          <>
            {current && (
              <Stack
                direction="row"
                spacing={1}
                sx={{ alignItems: 'center', mb: 2, flexWrap: 'wrap' }}
              >
                <Typography variant="body2">In uso:</Typography>
                <Chip size="small" label={current.url} sx={{ fontFamily: 'monospace' }} />
                <Typography variant="caption" color="text.secondary">
                  {SOURCES[current.source]}
                </Typography>
              </Stack>
            )}
            {fromEnv && (
              <Alert severity="info" sx={{ mb: 2 }}>
                L’indirizzo è impostato dalla variabile BUILD_INSPECTOR_API_URL: finché c’è, vince
                su quello salvato qui.
              </Alert>
            )}
            <TextField
              label="Indirizzo"
              placeholder="https://esempio.trycloudflare.com"
              value={value}
              onChange={(event) => {
                setValue(event.target.value)
                setStatus(null)
              }}
              error={!!value && !normalized}
              helperText={
                value && !normalized
                  ? 'Usa un indirizzo https://… (http solo per localhost).'
                  : 'Dopo il salvataggio l’app si riavvia per usare il nuovo server.'
              }
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <Stack direction="row" spacing={1.5} useFlexGap sx={{ mt: 2, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                disabled={!normalized || busy}
                startIcon={<Icon name="search" size={16} />}
                onClick={() =>
                  run(() => server.test(normalized!), 'Il server risponde correttamente.')
                }
              >
                Verifica
              </Button>
              <Button
                variant="contained"
                disabled={!normalized || busy || unchanged}
                startIcon={<Icon name="save" size={16} />}
                onClick={() =>
                  run(() => server.save(normalized), 'Salvato: l’app si sta riavviando…')
                }
              >
                Salva e riavvia
              </Button>
              {current?.source === 'saved' && (
                <Button
                  color="inherit"
                  disabled={busy}
                  onClick={() =>
                    run(() => server.save(null), 'Ripristinato: l’app si sta riavviando…')
                  }
                >
                  Torna a {current.defaultUrl}
                </Button>
              )}
            </Stack>
            {status && (
              <Alert severity={status.severity} sx={{ mt: 2 }} role="status">
                {status.text}
              </Alert>
            )}
          </>
        )}
      </Paper>
    </Box>
  )
}
