# Build Inspector

Build Inspector è un'applicazione desktop che ti dice se il tuo computer è in grado di far girare un gioco Steam.

Scansiona l'hardware del PC, scarica i requisiti minimi del gioco da Steam e li confronta componente per componente usando i punteggi [PassMark](https://www.passmark.com/) di CPU e GPU. Se qualcosa non basta, suggerisce cosa aggiornare.

## Funzionalità

- **Scansione del PC**: processore, scheda video, RAM, spazio libero, sistema operativo e scheda madre.
- **Confronto con i requisiti minimi**: per ogni requisito un verdetto (soddisfatto, insufficiente, da verificare) e un punteggio rispetto al minimo.
- **Consigli di upgrade**: processori compatibili con la tua scheda madre, schede video recenti, RAM e spazio su disco.
- **La mia build**: scegli a mano CPU, GPU e RAM per simulare un PC diverso dal tuo.
- **Catalogo giochi**: i più giocati su Steam negli ultimi 7 giorni, filtri per genere e ricerca.
- **Account**: registrazione con email o accesso con Google, Discord e Steam; cronologia dei confronti e giochi preferiti.

## Installazione

Scarica l'ultima versione dal [sito di Build Inspector](https://nighthvnter.github.io/Build-Inspector/) oppure dalla pagina delle [Release](https://github.com/NightHvnter/Build-Inspector/releases) di GitHub.

| Sistema | File |
|---|---|
| Windows 10/11 (64 bit) | `Build-Inspector-Setup.exe` |
| macOS 12 o successivo | `Build-Inspector-macOS.dmg` |
| Linux (x86_64) | `Build-Inspector-Linux.AppImage` o `Build-Inspector-Linux.deb` |

L'app non è firmata con un certificato a pagamento: al primo avvio Windows e macOS possono chiedere una conferma.

## Struttura del progetto

| Cartella | Contenuto |
|---|---|
| `build_inspector/` | App desktop (Electron, React, MUI) |
| `api/` | API (NestJS, TypeORM): proxy e cache verso Steam, catalogo hardware, account, cronologia, preferiti |
| `script/` | Script Python che scaricano i benchmark PassMark e li caricano nel database |
| `web/` | Sito di download (React, Vite), pubblicato su GitHub Pages |
| `docker-compose.yml` | Database MariaDB |

La documentazione tecnica completa è in [`documentazione.html`](documentazione.html).

## Avvio in locale

Requisiti: Node.js 24, Docker, Python 3 con `playwright`, `beautifulsoup4` e `pymysql`.

```bash
# 0. Credenziali del database (poi scegli le password in .env)
cp .env.example .env

# 1. Database
docker compose up -d

# 2. Catalogo CPU/GPU
cd script
python main.py
python update_db.py

# 3. API (crea prima api/.env con le variabili del database e i segreti JWT)
cd ../api
npm install
npm run start:dev

# 4. App desktop
cd ../build_inspector
npm install
npm run dev
```

L'app si collega all'API su `http://localhost:3636`. Puoi cambiare l'indirizzo dalla pagina Impostazioni o con la variabile `BUILD_INSPECTOR_API_URL`.

## Test

```bash
(cd build_inspector && npm test)
(cd api && npm test)
```

## Rilascio

Un tag `v*` avvia il workflow `release.yml`, che compila l'app per Windows, macOS e Linux e pubblica la release su GitHub. Ogni push su `master` aggiorna il sito tramite `pages.yml`.
