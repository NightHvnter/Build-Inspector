# API Contract

Last updated: 2026-10-05 · Owners: <your name> (client), <colleague> (API)

Base URL (dev): `http://localhost:3636`

Full list of routes: [`docs.md`](../../docs.md).

## Endpoints used by the app

| Method | Path | Success | Errors |
|---|---|---|---|
| GET | `/cpu` | 200, array of `{ Name, Mark }` sorted by name | |
| GET | `/gpu` | 200, array of `{ Name, Mark }` sorted by name | |
| GET | `/steam/games/search?q=` | 200, array of `{ appId, name, platform }` | |
| GET | `/steam/games/:appId` | 200, game details with `pc_requirements`; empty body if Steam doesn't know the id | 400, 503 |
| GET | `/steam/games/top?limit=&genre=` | 200, array of `{ appId, name, description, genres, image, averageRank, days }` | |
| GET | `/steam/games/top/genres` | 200, array of `{ name, games }` | |
| GET | `/steam/games/details?ids=` | 200, array of `{ appId, name, description, genres, image }` | |

## Other build routes

| Method | Path | Success | Errors |
|---|---|---|---|
| GET | `/build/cpu/:name` | 200, first `CpuDto` whose name contains `name` | |
| GET | `/build/gpu/:name` | 200, first `GpuDto` whose name contains `name` | |
| POST | `/build/ram/calc` | 200, `RamDto` plus `Mark` | |
| POST | `/build/score` | 200, `{ Cpu, Gpu, Ram }` scores | |

Name search is case-insensitive. Names in the path must be URL-encoded.

## POST /build/score

Body:

```json
{
  "ram": { "Name": "16GB DDR4", "CapacityGb": 16, "ClockSpeedMHz": 3200, "Latency": "CL16", "Type": "DDR4" },
  "cpu": "AMD Ryzen 5 5600X",
  "gpu": "GeForce RTX 3060"
}
```

- `cpu` and `gpu` are names; the first part whose name contains them is used.
- Integrated GPUs (e.g. `Radeon Vega 8`) go in `gpu` like any other GPU.
- Empty `Latency` (`""`) is treated by the API as `CL16`.

Response: `{ "Cpu": 21500, "Gpu": 17000, "Ram": 37.4 }` (PassMark marks for CPU and GPU, RAM score from `/build/ram/calc`).

## Types

```
RamDto { Name: string, CapacityGb: number, ClockSpeedMHz: number, Latency: string, Type: "DDR3" | "DDR4" | "DDR5" }
CpuDto { id: number, Name: string, Mark: number, Cores: number | null, Socket: string | null }
GpuDto { id: number, Name: string, Mark: number }
```

## Open questions

- [ ] Not-found name on `/build/score`: 400 or 404?
- [ ] Can CPU rows include their integrated GPU name?

## Changelog

- 2026-10-05: `Cpu` and `Gpu` in `/build/score` changed from objects to name strings.
- 2026-11-19: routes updated to the current API (`/build/cpu/:name`, `/steam/games/...`); `/build/score` body uses `cpu`, `gpu`, `ram` and returns the three scores.
