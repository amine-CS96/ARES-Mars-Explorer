# PROJECT_STATUS

> Live state of development. Update after every significant phase.
> **Current phase: PHASE 6 — Polish & demo (COMPLETE, verified). ARES is a shipped public product.**

Last updated: 2026-11-15 (Production Vercel DEM loading fixed & verified live)

---

## Snapshot

| Item | State |
| --- | --- |
| Repository | Initialized (git), main branch — final product state |
| Build | `npm run build` = `tsc -b && vite build` — **PASSING** (three.js isolated in lazy `vendor-three` chunk, 947 kB / 254 kB gzip, fetched only on `/globe` and `/explorer` 3D view) |
| Tests | Vitest — **105/105 passing** (geo, catalog integrity, globe math, Button, AtlasPage, GlobeFallback, slopeClass, costModel, A*, Mars24, oxygen model, hazards terrain analysis, risk model, hazard detection, route exposure + pathGrid regression, profile accessibility, export builders) · Playwright E2E — **42 passed / 2 skipped** (desktop + mobile projects; incl. hazards flows and 4-viewport reference screenshots in `e2e/screenshots/`) |
| Lint | `eslint .` — **PASSING** (0 errors, 0 warnings) |
| Typecheck | `tsc -b` strict — **PASSING** |
| Browser verification | **PASSING** — full public workflow verified: dashboard → globe → explorer → hazards → planner → simulator, with cross-module links, sample route, and zero console errors. **Production (Vercel) verified 2026-11-15**: all four `/data/*` DEM assets HTTP 200; `/hazards` full real analysis (40 clusters / 961 critical / 7.0 km² / 99.7% coverage) with zero console errors; `/planner` sample route 2.82 km / 919 kJ on the real DEM; `/hazards` Route tab shows 2.87 km exposure from the Planner route; all other routes load clean. |
| Dependencies | + three 0.187 / @react-three/fiber 9.8 / @react-three/drei 10.7 (Phase 2, lazy) · + geotiff 3.0.5 + sharp 0.35.5 (Phase 3 dev-time pipeline) · + recharts 2.x (Phase 4) |
| Network verification | Trek WMTS tiles ✓ (6 global + 2 regional layer IDs + CORS `*`), MMGIS waypoints ✓, USGS planetarymaps DEM ✓, NSSDCA ✓, USGS Gazetteer ✓, ODE ✓, api.nasa.gov ✓, GISS Mars24 ✓, Perseverance raw-images RSS feed ✓ |

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

### Phase 3 — Jezero surface explorer (Module C) — COMPLETE
- [x] K-3 gate: parsed HiRISE + CTX GetCapabilities; verified both use Trek `default028mm`
      matrix set; HiRISE serves zooms 14–17 inside WGS84 bbox 77.2229°E–77.5840°E,
      18.3068°N–18.6693°N; CTX serves zooms 8–13
- [x] DEM pipeline (`scripts/build-jezero-terrain.mjs`): USGS CTX 20 m DTM GeoTIFF (9.2 MB)
      → `jezero_heightmap_rg16.png` (R+G encode 16-bit elevation) +
      `jezero_slope_degrees.png` + `jezero_metadata.json`; round-trip error < 0.01 m
- [x] MMGIS rover-waypoint snapshot fetched and committed to `public/data/M20_waypoints.json`
      (snapshot label derived from the MMGIS filename)
- [x] 2D slippy map: pan/zoom, viewport tile compositor, layer toggles (HiRISE/CTX), attribution,
      honest degradation notes for failed tiles, rover-track SVG overlay
- [x] **Premium Explorer transformation (2026-11-15)**: full-screen GIS workspace with global
      base-map + regional overlay composition, professional layer panel, opacity slider, dynamic
      scale bar, lat/lon grid toggle, coverage boundary, point inspector, distance measurement,
      elevation profile from DEM samples, quick-location jumps, and tile-loading status
- [x] 3D terrain view: R3F plane displaced by the RG heightmap in a custom vertex shader,
      slope-class coloring in fragment shader, OrbitControls, vertical-exaggeration slider;
      improved with starfield, hemisphere + directional lighting, DEM coverage boundary line,
      and context plane
- [x] Cursor inspection panel: lat/lon, elevation (measured), slope (derived) with class badge
- [x] Verified live in browser: HiRISE + CTX layers switch, global base map visible beyond
      regional coverage, pan/zoom, elevation readout matches expected range, 3D view renders,
      zero console errors
- [x] Docs updated: K-3 resolved, DATA_SOURCES regional layers + DEM source, ARCHITECTURE
      Module C tree, README, CHANGELOG

### Phase 4 — Terrain analysis & routing (Modules E + F) — COMPLETE
- [x] Terrain engine (`src/engines/terrain/`): real elevation grid loader, slope classification,
      cost-grid builder with central-difference slope recomputation
- [x] **Premium Hazards workspace (2026-11-15)**: full-screen terrain-intelligence UI with
      collapsible analysis panel, hazard inventory, area assessment, charts, inspector, and
      coordinate bar
- [x] Hazards analysis engine (`src/engines/hazards/`): Horn slope, TRI, roughness, local relief,
      aspect, explicit nodata masking, connected-component clustering, configurable mobility
      profiles, and transparent risk scoring
- [x] Hazards visualization: slope / roughness / relief / aspect / combined-risk / cluster canvas
      overlays rendered over the global + regional base map
- [x] Hazards integration: Planner persists route path nodes; Hazards computes per-segment terrain
      exposure, severity percentages, and cluster intersections; "Send to Simulator" and
      "Plan route near cluster" actions
- [x] A* pathfinding engine (`src/engines/pathfinding/`): 8-connected binary-heap A*, Pandolf-derived
      metabolic-energy edge cost, Mars gravity + suit-penalty assumptions, admissible heuristic
- [x] Route planner UI: click-to-set start/destination, recommended + alternative routes,
      straight-line comparison, distance/energy/slope stats, terrain difficulty breakdown,
      explanation panel, elevation profile (Recharts)
- [x] Shared map components: `features/mars-explorer/index.ts` barrel (now includes `MapCanvas`),
      `viewport.ts`, `HazardOverlay.ts`, `TileMap` click + overlay support
- [x] Verified live in browser: hazard overlays, 40 dynamic clusters, inventory/assessment/charts
      panels, cluster inspection, Planner route exposure, zero console errors
- [x] Docs updated: `CHANGELOG.md`, `PROJECT_STATUS.md`, `DATA_SOURCES.md`, `KNOWN_ISSUES.md`,
      `DECISIONS.md` (D-012, D-015)

### Phase 6.1 — Hazards workspace redesign & route-handoff fixes (2026-11-15) — COMPLETE
- [x] Three-part GIS workspace: compact analysis header (metric chips, Methodology dialog,
      Export menu, Reset), collapsible left analysis controls, dominant map, right
      Inventory / Assessment / Analytics / Route tab panel; inspector replaces tabs on selection
- [x] Explainable inspector: per-factor contributions via `computeFactorContributions` (real
      ramp × weight math), measured-vs-derived labeling, nearest verified POI distances,
      back-to-inventory, "plan route near cluster"
- [x] Inventory: functional severity/factor/area/slope filters, sorting, ID search, hover map
      preview, severity-accented cards; engine severity colors shared across map/cards/charts
- [x] Map: SVG cluster outlines (hover/selected/analytics-highlight), route geometry overlay,
      optional Perseverance traverse overlay, cursor-following terrain tooltip, scale bar
- [x] Analytics: clickable severity/factor bars highlight matching clusters on the map (clearable);
      slope/roughness/relief histograms of real cluster statistics
- [x] Route-handoff fixes: persisted route now `{path, gridWidth, gridHeight}` (D-016);
      `computeRouteExposure` accepts `PathGridExtent` + precomputed analysis (no ~603k-cell
      recompute); summary key optional; `totalEnergyKJ` optional in `RouteSummary`; Planner
      persists every computed route and Reset clears the handoff
- [x] MMGIS waypoint parser accepts string and array coordinates (D-018) — committed snapshot
      renders again
- [x] Accessibility engine (`engines/hazards/accessibility.ts`) + tests; export builders
      (`exportAnalysis.ts`) + tests
- [x] Verified live and via Playwright: 42 passed / 2 skipped; reference screenshots captured at
      1920×1080, 1440×900, 1024×768, 390×844 (`e2e/screenshots/`)
- [x] Docs updated: `CHANGELOG.md`, `PROJECT_STATUS.md`, `DECISIONS.md` (D-016, D-017, D-018)

### Phase 5 — Marswalk simulation (Module G) — COMPLETE
- [x] Simulation engines (`src/engines/simulation/`):
      - `marsTime.ts` — NASA GISS Mars24 algorithm (Allison & McEwen 2000), validated against
        both GISS worked examples (2000-01-06 epoch case and Spirit landing case) in unit tests
      - `missionConfig.ts` — zod schema + default config; `RouteSummary` schema + the
        `ares:simulator-route-summary` localStorage key
      - `oxygenModel.ts` — Pandolf energy → 20.1 kJ/L O₂ → gas mass (1.429 g/L at STP);
        point-of-no-return with 1.2× return-path detour factor
      - `verdict.ts` — READY (margin ≥ +20%) / CAUTION / NO-GO classification
      - `radiation.ts` — MSL RAD 0.64 mSv/sol dose context vs. 600 mSv career limit
- [x] `SimulatorPage.tsx`: live Mars24 clock for Jezero (LTST/LMST/MSD/Lₛ/season/sun elevation),
      fully editable config (route, astronaut, suit, O₂, reserve, stops), oxygen budget panel,
      duration & energy panel, point-of-no-return panel, radiation context panel, assumptions
      panel with sources, and a persistent "planning estimate, not certified" disclaimer
- [x] Route-planner hand-off: "Send to Marswalk simulator" button exports distance, elevation
      gain/loss, max/average slope and total energy to localStorage; the simulator auto-imports
      it on arrival and labels the imported config
- [x] Verified live in browser: `/simulator` renders with zero console errors; the full
      planner → send → simulator round trip imports the real route (3.45 km in the walkthrough)
- [x] Docs updated: `CHANGELOG.md`, `PROJECT_STATUS.md`, `SCIENTIFIC_MODELS.md` (§3–§5b),
      `DEVELOPMENT_ROADMAP.md`, `ARCHITECTURE.md`

## In progress
- (nothing — all planned phases complete)

## Pending (next phases)
- No further phases planned for the Space Apps 2026 submission. Future work (additional regions, geologic map overlay, raw-image gallery) is tracked in `docs/KNOWN_ISSUES.md` and `docs/DATA_SOURCES.md`.

## Known bugs
- None recorded. Open risks/limitations tracked in `docs/KNOWN_ISSUES.md` (K-1…K-15).

## Environment notes (affect development)
- PowerShell execution policy blocks `npm.ps1` → use `npm.cmd` (documented; do not "fix" in scripts)
- PowerShell wraps npm's stderr banner (e.g. `> vite ...`) as error records → true exit codes must be
  read via `cmd /c "npm run <script>"` (see K-9); a "failed" npm run in PS may actually be exit 0
- Python is **not installed** on this machine → data pipeline uses Node (D-008)
- `mars.nasa.gov/mars2020/` returns 302 (redirect target not pinned); `science.nasa.gov/mars/`
  and `hirise.lpl.arizona.edu` unreachable from this environment (000) — URLs kept only where
  another verified source requires them, marked accordingly in `docs/DATA_SOURCES.md`

## Next recommended task
No further work required for the hackathon submission. For post-demo maintenance, see
`docs/FINAL_PRODUCT_AUDIT.md` for the complete audit and remaining polish opportunities.
