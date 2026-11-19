# Build Inspector API Documentation

Base URL (sviluppo): `http://localhost:3636`. Documentazione Swagger su `/api`.

Le rotte con **JWT** richiedono l'header `Authorization: Bearer <accessToken>`.

## Hardware

| Endpoint | Metodo | Auth | Parametri | Risposta |
|---|---|---|---|---|
| `/cpu` | GET | - | - | `200`: tutte le CPU `{ Name, Mark }[]`, ordinate per nome |
| `/cpu/get/:id` | GET | - | `id`: int | `200`: CPU `{ id, Name, Mark, Cores, Socket }`, corpo vuoto se non esiste |
| `/gpu` | GET | - | - | `200`: tutte le GPU `{ Name, Mark }[]`, ordinate per nome |
| `/gpu/get/:id` | GET | - | `id`: int | `200`: GPU `{ id, Name, Mark }`, corpo vuoto se non esiste |
| `/build/cpu/:name` | GET | - | `name`: string (match parziale) | `200`: prima CPU trovata |
| `/build/gpu/:name` | GET | - | `name`: string (match parziale) | `200`: prima GPU trovata |
| `/build/ram/calc` | POST | - | body `{ ram: RamDto }` | `200`: `RamDto` + `Mark` |
| `/build/score` | POST | - | body `BuildDto` | `200`: `{ Cpu, Gpu, Ram }` (punteggi) |

```
RamDto   { Name: string, CapacityGb: number, ClockSpeedMHz: number, Latency: string, Type: "DDR3" | "DDR4" | "DDR5" }
BuildDto { cpu: string, gpu: string, ram: RamDto }
```

## Steam

| Endpoint | Metodo | Auth | Parametri | Risposta |
|---|---|---|---|---|
| `/steam/games/search` | GET | - | `q`: string | `200`: `{ appId, name, platform }[]` |
| `/steam/games/:appId` | GET | - | `appId`: int | `200`: `{ type, name, steam_appid, short_description, header_image, pc_requirements, mac_requirements, linux_requirements, platforms }`, corpo vuoto se il gioco non esiste, `400` id non valido, `503` Steam non raggiungibile |
| `/steam/games/top` | GET | - | `limit`: 1-24 (default 6), `genre`: string opzionale | `200`: `{ appId, name, description, genres, image, averageRank, days }[]` |
| `/steam/games/top/genres` | GET | - | - | `200`: `{ name, games }[]` |
| `/steam/games/details` | GET | - | `ids`: lista separata da virgole (max 100) | `200`: `{ appId, name, description, genres, image }[]` |

I requisiti sono salvati nel database e richiesti di nuovo a Steam dopo 7 giorni.

## Account

| Endpoint | Metodo | Auth | Body | Risposta |
|---|---|---|---|---|
| `/auth/user` | POST | - | `{ Username, Email, Password }` | `201`: utente creato, `409` già in uso |
| `/auth/user/:id` | GET | JWT | - | `200`: utente, `404` |
| `/auth/user/:id` | PATCH | JWT | campi da modificare | `200` (solo il proprio utente, altrimenti `403`) |
| `/auth/login` | POST | - | `{ Email, Password }` | `200`: `{ id, Username, Email, accessToken, refreshToken }`, `401` |
| `/auth/refresh` | POST | - | `{ refreshToken }` | `200`: nuova coppia di token, `401` |
| `/auth/logout` | POST | JWT | - | `204` |
| `/auth/:provider/start` | GET | - | query `port`, `challenge`, `state` | redirect al provider (`google`, `discord`, `steam`) |
| `/auth/:provider/callback` | GET | - | - | redirect all'app su `127.0.0.1` |
| `/auth/oauth/exchange` | POST | - | `{ code, verifier }` | `200`: come `/auth/login`, `401` |

## Cronologia e preferiti

| Endpoint | Metodo | Auth | Body | Risposta |
|---|---|---|---|---|
| `/history` | GET | JWT | - | `200`: ultime 100 voci |
| `/history` | POST | JWT | `{ AppId, GameName, CpuName, GpuName, RamGb, Met, Failed, ToCheck }` | `201`: voce salvata |
| `/history/:id` | DELETE | JWT | - | `204`, `404` |
| `/history` | DELETE | JWT | - | `204`: cronologia svuotata |
| `/favorites` | GET | JWT | - | `200`: `number[]` (app id) |
| `/favorites` | POST | JWT | `{ AppIds: number[] }` | `200`: lista aggiornata, `400` oltre 500 preferiti |
| `/favorites/:appId` | DELETE | JWT | - | `200`: lista aggiornata |
