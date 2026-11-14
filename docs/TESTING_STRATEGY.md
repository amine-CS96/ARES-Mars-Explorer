# TESTING_STRATEGY

## Layers

| Level | Tool | Scope | Gate |
| --- | --- | --- | --- |
| Unit | Vitest | engines, utils, geo math, cost models, zod schemas | every commit |
| Data integrity | Vitest | `data/*.ts` parse + invariant checks (coords in range, sources present, unique ids) | every commit |
| Component | Vitest + RTL | UI primitives, pages render, badges show correct vocabulary | every commit |
| E2E (Phase 6) | Playwright | critical flows: dashboard loads with real tiles, Atlas search, route plan, simulator verdict | release |

## Invariants worth testing (the scientific spine)

1. **Geo math:** haversine matches published distances (e.g. Octavia E. Butler Landing →
   Three Forks ≈ 4.6 km ±0.5); formatting round-trips; lon conversions 0–360 ⇄ ±180.
2. **Catalog integrity:** every POI has ≥1 source; `verified` coords cite MMGIS/PDS/Gazetteer;
   fictional entries are `illustrative`; no duplicate ids; zod `.parse` throws at import if
   data is hand-edited wrongly.
3. **Model determinism:** engines are pure — same input → same output (golden-value tests).
4. **Admissibility:** route heuristic never exceeds true cost (property test on random grids).
5. **UI honesty:** every dataset surface renders a kind badge; every coordinate view shows
   accuracy; simulator view renders the assumptions panel.

## Conventions

- Tests co-located (`src/**/__tests__` avoided; `*.test.ts(x)` next to subject).
- No network in unit tests (jsdom); component tests mock TanStack Query hooks where needed.
- Golden values cited in comments (which source, which page).
- CI-like loop locally: `typecheck && lint && test && build`.

## Current coverage (updated per phase in PROJECT_STATUS.md)

- Phase 1: geo utils, catalog integrity, Button/Atlas smoke — initial suites written this phase.
