# API_INTEGRATION

How ARES consumes external services. Principle: **providers own retrieval; UI owns display**;
nothing is invented; every consumer can explain where data came from.

## 1. Provider architecture (`src/services/nasa/`)

- `marsTrekProvider.ts` — builds verified WMTS tile URLs; exposes typed `TrekLayer` descriptors
  (id, title, mission, instrument, resolution, extension, coverage scope). Tile URL builder is
  pure and unit-tested.
- `dataCatalog.ts` — typed registry over `src/data/datasets.ts` (status, kind, credits).
- Later: `imageryProvider.ts`, `elevationProvider.ts` (PDS/ODE + local pipeline assets),
  `thermalProvider.ts`, `spaceWeatherProvider.ts` (api.nasa.gov DONKI, optional).

## 2. Fetching rules

- **TanStack Query** for all async data: keys include layer id + tile coords; `staleTime` long
  for immutable tiles; `retry: 2` with backoff; `refetchOnWindowFocus: false` for tiles.
- **Timeouts** on every fetch (AbortController); failures surface as layer-level fallbacks.
- **No API keys** in the client. If a keyed API becomes necessary (e.g. DONKI), it goes behind
  a serverless function or ships with `DEMO_KEY` + rate-limit-aware caching and an honest
  "not checked" state (reference project's approach — adopted at design level).

## 3. CORS reality check

- Trek tiles were verified reachable by HTTP from this environment. Browser CORS for
  canvas/WebGL texture upload is a **separate** question from reachability and must be
  verified during Phase 2 integration (`fetch` + `createImageBitmap` path or `<img>` for
  CSS use). If WebGL needs CORS headers Trek does not send, fallback plan: self-host the
  processed textures via our asset pipeline (same files, same attribution).
- MMGIS JSON is same-origin-safe for `<img>`-style use but CORS must be checked before fetch()
  consumption; otherwise snapshot it into `public/data/` with source + date.

## 4. Data kind semantics (UI badge ↔ contract)

| Kind | Meaning | Cache policy |
| --- | --- | --- |
| `LIVE` | fetched at runtime, may change | short staleTime |
| `STATIC` | immutable product (tiles) | staleTime ∞ |
| `SNAPSHOT` | fetched once, stored locally with date | manual refresh |
| `DERIVED` | computed locally from real data (slope…) | recomputed on asset change |
| `SIMULATED` | synthetic for demo | labeled, never mixed with real |
| `PORTAL` | we link out; no integration | none |

## 5. Integrity checklist for any new integration

1. Endpoint documented by the provider (link recorded in `docs/DATA_SOURCES.md`).
2. Live check performed from this environment (HTTP code recorded + date).
3. Zod schema for the response shape; unknown fields tolerated, required fields checked.
4. Attribution rendered with the data.
5. Failure path designed (fallback UI, cache, retry).
6. If any check fails → `pending-verification` status; nothing ships as if verified.
