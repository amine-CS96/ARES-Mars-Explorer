# PROJECT_STATUS

> Live state of development. Update after every significant phase.
> **Current phase: PHASE 2 — 3D Mars globe (COMPLETE, verified)**

Last updated: 2026-11-14

---

## Snapshot

| Item | State |
| --- | --- |
| Repository | Initialized (git), main branch — Phase 1 committed (`50a4a20`) |
| Build | `npm run build` = `tsc -b && vite build` — **PASSING** (three.js isolated in lazy `vendor-three` chunk, 947 kB / 254 kB gzip, fetched only on `/globe`) |
| Tests | Vitest — **42/42 passing** (geo, catalog integrity, globe math, Button, AtlasPage, GlobeFallback) |
| Lint | `eslint .` — **PASSING** (0 errors, 0 warnings) |
| Typecheck | `tsc -b` strict — **PASSING** |
| Browser verification | **PASSING** — Phase 2 globe walked live: all three texture layers composed (MOLA/Viking/HRSC, 200s), marker↔texture geography verified, dialogs, tiers, cursor readout; zero console errors |
| Dependencies | + three 0.187 / @react-three/fiber 9.8 / @react-three/drei 10.7 (Phase 2, lazy) |
| Network verification | Trek WMTS tiles ✓ (6 layer IDs + CORS `*`), MMGIS waypoints ✓, NSSDCA ✓, USGS Gazetteer ✓, ODE ✓, api.nasa.gov ✓, GISS Mars24 ✓ |

## Completed

### Phase 0 — Inspection, references, documentation system
- [x] Environment inspected (Windows 11, Node 24.20, npm 11.19 via `npm.cmd`, **no Python**)
- [x] Working directory was empty — clean start, no pre-existing work to preserve
- [x] **Sol Atlas** reference studied (README + live repo): three-level architecture
      (orbit → crater → marswalk zone), NASA data pipeline into PNG heightmaps (16-bit height
      split across R/G channels), A* with metabolic-energy cost, Pandolf load-carriage model,
      Mars24 clock, RAD dose (Hassler et al. 2014), quality tiers + adaptive resolution,
      verified POI coordinates (MMGIS/PDS-derived). Ideas adopted at architecture level only;
      **no code copied** (Apache-2.0 respected, attribution in docs)
- [x] **NASA Mars Trek WMTS API** studied: official tile URL template captured from
      `trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars`; 146 Mars layer products catalogued
      from TrekServices `searchItems` (metadata: title/mission/instrument); live tile
      verification for 6 global layer IDs (see `docs/DATA_SOURCES.md`)
- [x] Endpoint reachability verified with HTTP checks (results in `docs/DATA_SOURCES.md`)
- [x] Full documentation system created (this file + `docs/*` + `AGENTS.md` + `CHANGELOG.md`)
- [x] Architecture decided and recorded (`docs/DECISIONS.md` D-001…D-009)

### Phase 1 — Foundation (implementation in progress)
- [x] Vite + React 19 + TypeScript strict scaffold (manual, deterministic)
- [x] Tailwind CSS v4 wired via `@tailwindcss/vite`; dark-only design tokens in `@theme`
- [x] ESLint flat config + Prettier; Vitest + RTL + jsdom wired
- [x] App shell: top navigation (desktop) + mobile drawer (Radix Dialog), status chip
- [x] Routing: `/` dashboard, `/globe`, `/explorer`, `/atlas`, `/hazards`, `/planner`,
      `/simulator`, `/data-sources`, 404 — lazy-loaded feature pages
- [x] Design system: tokens, typography (Orbitron/Inter/JetBrains Mono), panels, glow, motion
- [x] UI primitives (shadcn-style, hand-written): Button, Badge, Card, Dialog, Separator,
      Skeleton, Tooltip, StatusBadges (data-kind / accuracy / phase)
- [x] Verified data layer: `src/data/{places,datasets,planetaryFacts,program}.ts` + zod schemas
- [x] Mars Trek provider (`services/nasa/marsTrekProvider.ts`) with verified tile builder
- [x] Dashboard Module A (hero with real MOLA mosaic strip, module grid, planetary stats,
      featured POIs, program status, data-source strip)
- [x] Atlas Module D foundation (search/filter/detail on verified POI data)
- [x] Data Sources Module H foundation (registry cards with kind/status/credits)

- [x] Data Sources Module H foundation (registry cards with kind/status/credits)
- [x] **Full verification pass (2026-11-14)**:
      typecheck ✓ · lint ✓ · tests 26/26 ✓ · build exit 0 ✓ · live browser walkthrough ✓
      - Live MOLA tiles fetched by the dashboard confirmed **HTTP 200** in browser network log
        (`0/0/0.jpg`, `0/0/1.jpg` from `Mars_MGS_MOLA_ClrShade_merge_global_463m`)
      - Atlas: detail dialog (badges, decimal+DMS coordinates, copy button, sources) ✓;
        category filter ✓ (Geology → correct "4 / 10 sites"); search ✓ ("Olympus" → 1/10)
      - Data Sources: 14 dataset entries with honest PENDING CHECK badges ✓
      - Module placeholder route `/planner` (Module F roadmap) ✓
      - Mobile: hamburger nav < lg breakpoint, drawer dialog with all 8 links, navigation ✓;
        no horizontal overflow at 912 px
      - Zero console errors on every visited route

### Phase 2 — 3D Mars globe (Module B) — COMPLETE
- [x] K-6 gate verified first: Trek tiles send `Access-Control-Allow-Origin: *` → WebGL-safe
- [x] `three` 0.187 / `@react-three/fiber` 9.8 / `@react-three/drei` 10.7 installed; `vendor-three`
      manual chunk (lazy, fetched only on `/globe`; three-stdlib moved in to kill a chunk cycle)
- [x] Pure math layer (`features/globe/math.ts`, unit-tested): lat/lon ↔ sphere projection
      (verified against three r0.187 SphereGeometry source), 2:1 tile pyramid, quality tiers,
      graticule builder, marker color tokens, adaptive-quality rule
- [x] Mosaic composer (`composeMosaic.ts`): verified tiles → canvas, 6-way concurrency,
      one bounded retry pass (absorbs transient `ERR_TIMED_OUT`), failed tiles stay dark +
      counted; TanStack Query cache per (layer, zoom) with previous-frame placeholder
- [x] Scene (`scene/`): MOLA/Viking/HRSC textured planet, static sun lighting, illustrative
      atmosphere rim shader (BackSide fresnel), 15° graticule (equator/prime highlighted),
      category-colored POI markers with hover labels and click → shared Atlas detail dialog,
      damped OrbitControls (touch-ready), camera fly-to on site selection (reduced-motion aware),
      idle spin (auto-pauses on selection), FPS probe
- [x] HUD: texture-layer picker, quality picker (L/M/H + auto), fps/texture readout, cursor
      lat/lon readout, category legend, per-layer attribution, grid/spin toggles, honest
      degradation notes; site rail for keyboard access; loading progress (tiles x/y)
- [x] Failure surfaces: WebGL probe → flat live-mosaic fallback; scene error boundary →
      same; tile-fetch failure → retry + fallback with explanation; all labeled
- [x] Verified live in browser: 60 fps at medium/high/low tiers, geographic accuracy checked
      (Olympus Mons marker on the Tharsis shield in two texture layers), zero console errors
- [x] Docs updated: D-011 (composite decision), K-6 resolved, K-10 recorded (transient tile
      timeouts + mitigation), DATA_SOURCES §1 extended (CORS + zoom-grid checks), ARCHITECTURE
      directory/data-flow, TECH_STACK, README

## In progress
- (nothing — Phase 2 closed)

## Pending (next phases)
- **Phase 3 — Jezero surface explorer**: regional Trek tiles (derive URLs from each layer's
  GetCapabilities), DEM ingestion via Node `geotiff.js`+`sharp` pipeline (no Python here),
  layer manager, elevation/slope panels
- **Phase 4 — Terrain analysis & routing**: slope classification, hazard overlay, A* on
  terrain-cost grid, route comparison, elevation profiles (Recharts)
- **Phase 5 — Marswalk simulator**: oxygen budget (Pandolf-derived), Mars24 mission clock,
  READY/CAUTION/NO-GO verdict, return feasibility
- **Phase 6 — Polish**: performance, a11y, Playwright E2E, demo script, deployment

## Known bugs
- None recorded. Open risks/limitations tracked in `docs/KNOWN_ISSUES.md` (K-1…K-9).

## Environment notes (affect development)
- PowerShell execution policy blocks `npm.ps1` → use `npm.cmd` (documented; do not "fix" in scripts)
- PowerShell wraps npm's stderr banner (e.g. `> vite ...`) as error records → true exit codes must be
  read via `cmd /c "npm run <script>"` (see K-9); a "failed" npm run in PS may actually be exit 0
- Python is **not installed** on this machine → data pipeline planned in Node (D-008)
- `mars.nasa.gov/mars2020/` returns 302 (redirect target not pinned); `science.nasa.gov/mars/`
  and `hirise.lpl.arizona.edu` unreachable from this environment (000) — URLs kept only where
  another verified source requires them, marked accordingly in `docs/DATA_SOURCES.md`

## Next recommended task
Start **Phase 3 — Jezero surface explorer** (Module C): parse each Jezero layer's WMTS
GetCapabilities for the correct matrix sets/zoom ranges (K-3), build the Node DEM pipeline
(`geotiff.js` + `sharp`, D-008), then the 2D explorer + 3D terrain view with elevation/slope
panels — all elevation numbers labeled and never fabricated.
