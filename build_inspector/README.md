# build_inspector

An Electron application with React and TypeScript

## Collegare l’app al backend del gruppo

Avvia l’API NestJS del ramo `dev/api` con il suo database. L’app usa per impostazione
predefinita `http://localhost:3000`. Dalla cartella `build_inspector`, avvia
l’app con `npm.cmd run dev`. Se il gruppo usa un server diverso, imposta prima
`$env:BUILD_INSPECTOR_API_URL = 'https://api.example.org'` in PowerShell,
sostituendo l’esempio con l’indirizzo reale. Usa HTTPS per i server remoti.

Il form passa i dati all’hook di accesso; il processo Electron chiama queste API:

| Operazione | Richiesta |
| --- | --- |
| Registrazione | `POST /auth/user` con `Username`, `Email`, `Password` |
| Accesso | `POST /auth/login` con `Email`, `Password` |
| Rinnovo della sessione | `POST /auth/refresh` con `refreshToken` |
| Uscita | `POST /auth/logout` con `Authorization: Bearer <accessToken>` |

La registrazione non effettua il login. I token restano nella memoria di
Electron e vengono persi quando l’app si chiude. Il servizio non offre ancora
il recupero password via email. La libreria rimane consultabile senza account.

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```
