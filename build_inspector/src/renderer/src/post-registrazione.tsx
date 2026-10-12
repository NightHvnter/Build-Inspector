import { useState, type JSX } from 'react'
import { Alert, Button, Chip, MenuItem, TextField } from '@mui/material'
import { Icon } from './components/Icon'
import type { Game } from './games'
interface Component {
  name: string
  score: number
}

const CPUS: Component[] = [
  { name: 'Intel Core i3-12100F', score: 45 },
  { name: 'AMD Ryzen 5 3600', score: 48 },
  { name: 'Intel Core i5-12400F', score: 58 },
  { name: 'AMD Ryzen 5 5600', score: 60 },
  { name: 'Intel Core i5-13600K', score: 78 },
  { name: 'AMD Ryzen 7 5800X3D', score: 82 },
  { name: 'AMD Ryzen 7 7800X3D', score: 95 },
  { name: 'Intel Core i9-14900K', score: 100 }
]

const GPUS: Component[] = [
  { name: 'NVIDIA GTX 1060', score: 28 },
  { name: 'NVIDIA GTX 1660 Super', score: 38 },
  { name: 'NVIDIA RTX 2060', score: 45 },
  { name: 'NVIDIA RTX 3060', score: 55 },
  { name: 'NVIDIA RTX 3070', score: 68 },
  { name: 'AMD RX 6800 XT', score: 78 },
  { name: 'NVIDIA RTX 4070', score: 82 },
  { name: 'NVIDIA RTX 4080', score: 92 },
  { name: 'NVIDIA RTX 4090', score: 100 }
]

const RAM_OPTIONS = [8, 16, 32, 64]

// Punteggio di riferimento: con un componente da 60 si ottiene il baseFps del gioco
const REFERENCE_SCORE = 60
const RAM_PENALTY = 0.6

function estimateFps(game: Game, cpuScore: number, gpuScore: number, ram: number): number {
  const effective = Math.min(cpuScore, gpuScore)
  let fps = (game.baseFps * effective) / REFERENCE_SCORE
  if (ram < game.reqRam) {
    fps *= RAM_PENALTY
  }
  return Math.round(fps)
}

function getStatus(fps: number): { label: string; color: 'success' | 'warning' | 'error' } {
  if (fps >= 60) return { label: 'Fluido', color: 'success' }
  if (fps >= 30) return { label: 'Giocabile', color: 'warning' }
  return { label: 'Insufficiente', color: 'error' }
}

function getBottleneck(cpuScore: number, gpuScore: number): { text: string; balanced: boolean } {
  if (cpuScore < gpuScore * 0.75) {
    return {
      text: 'La CPU è troppo debole per la GPU scelta: limita le prestazioni.',
      balanced: false
    }
  }
  if (gpuScore < cpuScore * 0.75) {
    return {
      text: 'La GPU è troppo debole per la CPU scelta: limita le prestazioni.',
      balanced: false
    }
  }
  return {
    text: 'CPU e GPU sono ben bilanciate: nessun collo di bottiglia evidente.',
    balanced: true
  }
}

interface Build {
  cpuName: string
  gpuName: string
  ram: number
}
const DEFAULT_BUILD: Build = { cpuName: CPUS[1].name, gpuName: GPUS[1].name, ram: 16 }
function readBuild(profileId: string): Build {
  try {
    const stored = JSON.parse(localStorage.getItem(`bi.build.${profileId}`) ?? 'null')
    if (
      stored &&
      CPUS.some((cpu) => cpu.name === stored.cpuName) &&
      GPUS.some((gpu) => gpu.name === stored.gpuName) &&
      RAM_OPTIONS.includes(stored.ram)
    )
      return { cpuName: stored.cpuName, gpuName: stored.gpuName, ram: stored.ram }
  } catch {
    /* An invalid configuration falls back to the editable default. */
  }
  return DEFAULT_BUILD
}

export function PostRegistrazione({
  games,
  profileId
}: {
  games: Game[]
  profileId: string
}): JSX.Element {
  const [savedBuild, setSavedBuild] = useState(() => readBuild(profileId))
  const [build, setBuild] = useState(savedBuild)
  const [notice, setNotice] = useState('')
  const [saveError, setSaveError] = useState(false)
  const cpu = CPUS.find((entry) => entry.name === build.cpuName) ?? CPUS[0]
  const gpu = GPUS.find((entry) => entry.name === build.gpuName) ?? GPUS[0]
  const bottleneck = getBottleneck(cpu.score, gpu.score)
  const dirty = JSON.stringify(build) !== JSON.stringify(savedBuild)
  const update = (next: Partial<Build>): void => {
    setBuild((previous) => ({ ...previous, ...next }))
    setNotice('')
  }
  const save = (): void => {
    try {
      localStorage.setItem(`bi.build.${profileId}`, JSON.stringify(build))
      setSavedBuild(build)
      setSaveError(false)
      setNotice('Configurazione salvata nel tuo profilo locale.')
    } catch {
      setSaveError(true)
      setNotice('Impossibile salvare. Verifica lo spazio disponibile e riprova.')
    }
  }
  return (
    <div className="build-page">
      <div className="eyebrow">
        <span className="accent-dot" />
        Pannello PC
      </div>
      <div className="section-heading build-heading">
        <div>
          <h1>La mia configurazione</h1>
          <p>Scegli i componenti del tuo PC e prova il simulatore di prestazioni.</p>
        </div>
        <span className="local-badge">
          <Icon name="monitor" size={15} />
          Profilo locale
        </span>
      </div>
      <section className="build-config" aria-labelledby="build-title">
        <div className="section-heading">
          <h2 id="build-title">
            <Icon name="chip" size={21} />
            La tua configurazione
          </h2>
          <span className="save-state">
            {dirty ? 'Modifiche da salvare' : 'Nessuna modifica in sospeso'}
          </span>
        </div>
        <div className="config-grid">
          <div>
            <span className="component-label">Processore</span>
            <TextField
              select
              label="CPU"
              value={build.cpuName}
              onChange={(event) => update({ cpuName: event.target.value })}
            >
              {CPUS.map((entry) => (
                <MenuItem key={entry.name} value={entry.name}>
                  {entry.name}
                </MenuItem>
              ))}
            </TextField>
          </div>
          <div>
            <span className="component-label">Scheda video</span>
            <TextField
              select
              label="GPU"
              value={build.gpuName}
              onChange={(event) => update({ gpuName: event.target.value })}
            >
              {GPUS.map((entry) => (
                <MenuItem key={entry.name} value={entry.name}>
                  {entry.name}
                </MenuItem>
              ))}
            </TextField>
          </div>
          <div>
            <span className="component-label">Memoria</span>
            <TextField
              select
              label="RAM"
              value={build.ram}
              onChange={(event) => update({ ram: Number(event.target.value) })}
            >
              {RAM_OPTIONS.map((entry) => (
                <MenuItem key={entry} value={entry}>
                  {entry} GB
                </MenuItem>
              ))}
            </TextField>
          </div>
        </div>
        <div className="config-actions">
          <span>
            {dirty
              ? 'Salva prima di cambiare pagina per conservare le modifiche.'
              : 'La configurazione viene conservata solo quando premi Salva.'}
          </span>
          <Button variant="contained" onClick={save} startIcon={<Icon name="save" size={17} />}>
            Salva configurazione
          </Button>
        </div>
        {notice && (
          <Alert severity={saveError ? 'error' : 'success'} sx={{ mt: 2 }}>
            {notice}
          </Alert>
        )}
      </section>
      <div className="build-insights">
        <div className="insight-icon">
          <Icon name="bolt" size={26} />
        </div>
        <div>
          <h3>
            {bottleneck.balanced
              ? 'Componenti bilanciati nel modello'
              : 'Differenza tra i componenti'}
          </h3>
          <p>
            {bottleneck.balanced
              ? 'Nel modello dimostrativo, i punteggi di CPU e GPU sono vicini.'
              : 'Nel modello dimostrativo, il componente con il punteggio più basso limita la stima.'}
          </p>
        </div>
        <span className="local-badge">Simulazione</span>
      </div>
      <div className="section-heading simulation-heading">
        <div>
          <div className="eyebrow">Risultati</div>
          <h2>Prestazioni simulate</h2>
        </div>
        <span className="catalog-caption">{games.length} giochi nel catalogo</span>
      </div>
      <Alert severity="info" sx={{ mb: 2 }}>
        Questi valori provengono da un modello semplificato, non da test reali. Non includono
        risoluzione, dettagli grafici o driver e non garantiscono gli FPS effettivi.
      </Alert>
      <div className="benchmark-table">
        <table>
          <caption className="sr-only">FPS dimostrativi per la configurazione selezionata</caption>
          <thead>
            <tr>
              <th>GIOCO</th>
              <th>RAM DI RIFERIMENTO</th>
              <th>FPS SIMULATI</th>
              <th>ESITO DEL MODELLO</th>
            </tr>
          </thead>
          <tbody>
            {games.map((game) => {
              const fps = estimateFps(game, cpu.score, gpu.score, build.ram)
              const status = getStatus(fps)
              return (
                <tr key={game.id}>
                  <td>
                    <span className="table-game-icon">
                      <Icon name="game" size={18} />
                    </span>
                    <strong>{game.title}</strong>
                  </td>
                  <td>
                    {game.reqRam} GB
                    {build.ram < game.reqRam && (
                      <span className="ram-warning">RAM selezionata inferiore</span>
                    )}
                  </td>
                  <td>
                    <strong className="fps-value">{fps}</strong>
                    <span className="fps-unit"> FPS</span>
                  </td>
                  <td>
                    <Chip
                      label={status.label}
                      color={status.color}
                      size="small"
                      variant="outlined"
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
