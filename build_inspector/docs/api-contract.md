# API Contract

Last updated: 2026-10-05 · Owners: <your name> (client), <colleague> (API)

Base URL (dev): `http://localhost:3000`

## Endpoints

| Method | Path | Success | Errors |
|---|---|---|---|
| GET | `/build/get-cpu/:name` | 200, array of `CpuDto` (exact match first, then partial); `[]` if none | |
| GET | `/cpu/get/:id` | 200, `CpuDto` | 404 |
| GET | `/build/get-gpu/:name` | 200, array of `GpuDto` (exact first, then partial); `[]` if none | |
| GET | `/gpu/get/:id` | 200, `GpuDto` | 404 |
| POST | `/build/score` | 200, integer | 400 if Ram, Cpu or Gpu missing |

Name search is case-insensitive. Names in the path must be URL-encoded.

## POST /build/score

Body:

```json
{
  "Ram": { "Name": "16GB DDR4", "CapacityGb": 16, "ClockSpeedMHz": 3200, "Latency": "CL16", "Type": "DDR4" },
  "Cpu": "AMD Ryzen 5 5600X",
  "Gpu": "GeForce RTX 3060"
}
```

- `Cpu` and `Gpu` are names only, exactly as stored in the database tables.
- Integrated GPUs (e.g. `Radeon Vega 8`) go in `Gpu` like any other GPU.
- Empty `Latency` (`""`) is treated by the API as `CL16`.

Response: a plain integer, e.g. `12345`.

## Types

(paste RamDto, CpuDto, GpuDto here)

## Open questions

- [ ] Not-found name on `/build/score`: 400 or 404?
- [ ] Can CPU rows include their integrated GPU name?

## Changelog

- 2026-10-05: `Cpu` and `Gpu` in `/build/score` changed from objects to name strings.