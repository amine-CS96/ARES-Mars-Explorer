# CHANGELOG

All significant changes to ARES. Format: date — phase — summary.

## 2026-11-14 — Phase 0 + 1 — Project birth

### Phase 0 — Inspection & documentation system
- Inspected environment (Node 24, npm 11.19, Windows; Python unavailable).
- Studied references: **Sol Atlas** repo (architecture, data pipeline, science models,
  verified coordinates) and **NASA Mars Trek** WMTS API (tile template, layer catalog).
- Verified live endpoints with HTTP checks; catalogued 146 Mars Trek layer products.
- Created the permanent documentation system (`AGENTS.md`, `README.md`, `PROJECT_STATUS.md`,
  `CHANGELOG.md`, `docs/*` ×14).
- Recorded architecture decisions D-001…D-009 in `docs/DECISIONS.md`.

### Phase 1 — Professional application foundation
- Scaffolded React 19 + Vite 7 + TypeScript (strict) project; Tailwind CSS v4 design system
  with the mandated palette (#080B12 / #111722 / #E56B3F / #53D6E8) and typography
  (Orbitron / Inter / JetBrains Mono).
- Wired ESLint (flat), Prettier, Vitest + Testing Library.
- Built app shell: responsive top navigation, mobile drawer (Radix Dialog), footer with
  attribution, error boundary, scroll restoration.
- Implemented routing for all modules with lazy loading: `/`, `/globe`, `/explorer`,
  `/atlas`, `/hazards`, `/planner`, `/simulator`, `/data-sources`, 404.
- Built UI primitives: Button, Badge, Card, Dialog, Separator, Skeleton, Tooltip,
  StatusBadges (data kind, coordinate accuracy, phase).
- Implemented **Module A — Mission Dashboard** with a real MOLA mosaic strip (Trek WMTS),
  module grid, planetary statistics (NSSDCA), featured locations, program status.
- Implemented **Module D — Points of Interest** foundation: zod-validated, source-cited
  catalog of verified/approximate/illustrative locations with search, filters and detail
  dialogs.
- Implemented **Module H — Data Sources** foundation: registry of datasets with provider,
  mission, instrument, kind (live/static/processed/external), status, credits.
- Added Mars Trek tile provider with verified layer IDs and tile-URL builder.
- Added unit/component tests (geo math incl. haversine sanity check against published
  Jezero site distances; data-integrity tests; UI smoke tests).
- **Verification pass complete**: typecheck ✓ · lint ✓ · Vitest 26/26 ✓ · `vite build`
  exit 0 (vendor chunks split; main index 264 kB / 82.7 kB gzip) ✓ · live browser
  walkthrough of dashboard, atlas (dialog/filter/search), data-sources and a placeholder
  module route, plus mobile drawer navigation — zero console errors; live MOLA tiles
  confirmed HTTP 200 in the browser network log.
- Git: initial commit `50a4a20` on `main` (92 files).

## 2026-11-14 — Phase 2 — 3D Mars globe (Module B)

- **K-6 gate first**: verified Trek tiles serve `Access-Control-Allow-Origin: *` — WebGL-safe
  without any server (K-6 resolved; D-011 records the composite decision).
- Installed `three` 0.187.0, `@react-three/fiber` 9.8.2, `@react-three/drei` 10.7.9; added the
  `vendor-three` manual chunk (with `three-stdlib`) — three.js loads only on `/globe`.
- **Pure math module** (`features/globe/math.ts` + tests): lat/lon ↔ sphere projection derived
  from and verified against the three r0.187 `SphereGeometry` source; 2:1 WMTS tile pyramid
  (zoom z → `2^(z+1)`×`2^z`); quality tiers; graticule builder; marker color token mirror;
  adaptive-quality decision rule. Round-trip tests over every catalog POI.
- **Mosaic composer** (`composeMosaic.ts`): composites verified Trek tiles onto a canvas
  (6-way concurrency, abortable, monotonic progress, one bounded retry pass); failed tiles stay
  dark and are counted — never substituted. TanStack Query caches composites per (layer, zoom)
  with previous-frame placeholder behavior.
- **Scene**: textured planet (MOLA hillshade / Viking color / MOLA+HRSC blend), static sun,
  illustrative atmosphere rim shader, 15° graticule with highlighted equator/prime meridian,
  category-colored POI markers (hover labels; click → shared Atlas detail dialog), damped
  orbit/zoom/touch controls, camera fly-to on selection (reduced-motion aware), idle spin that
  pauses on selection, FPS probe with auto-downgrade.
- **HUD + page**: layer/quality pickers, fps + texture readout, cursor lat/lon readout,
  category legend, per-layer attribution (NASA/JPL/USGS/ESA-DLR per layer), grid/spin toggles,
  loading progress, keyboard-accessible site rail, honest footer notes (texture derived,
  markers labeled, atmosphere illustrative, not an operational system).
- **Failure surfaces**: WebGL probe → flat live-mosaic fallback; scene error boundary;
  tile-fetch failure → retry + explained fallback.
- **Verified live**: 60 fps at all tiers (medium default; high = 4096×2048, 128 tiles);
  geography confirmed (Olympus marker on the Tharsis shield in both texture layers); marker →
  dialog on both paths; cursor readout correct; zero console errors; degradation UI shown when
  2/128 tiles timed out (K-10 recorded, retry added).
- Quality gates: typecheck ✓ · lint ✓ · Vitest 42/42 ✓ · build exit 0 with clean chunk graph.

## 2026-11-14 — Phase 3 — Jezero surface explorer (Module C)

- **K-3 gate resolved**: parsed WMTS GetCapabilities for `JEZ_hirise_soc_006_orthoMosaic_25cm_Eqc_latTs0_lon0_first_dd`
  and `JEZ_ctx_B_soc_008_orthoMosaic_6m_Eqc_latTs0_lon0`; both use Trek `default028mm` matrix set.
  HiRISE serves zooms 14–17 inside bbox 77.2229°E–77.5840°E / 18.3068°N–18.6693°N; CTX serves
  zooms 8–13. Live tile requests verified (HTTP 200 inside bbox, 404 outside).
- **DEM pipeline** (`scripts/build-jezero-terrain.mjs`): downloaded the verified USGS CTX 20 m
  DTM mosaic (9.2 MB) and processed it with `geotiff.js` + `sharp` (no Python). Outputs committed
  to `public/data/`: `jezero_heightmap_rg16.png` (R+G encode 16-bit elevation, ~4.7 MB),
  `jezero_slope_degrees.png` (8-bit grayscale, ~950 kB), `jezero_metadata.json`. Round-trip
  elevation error < 0.01 m against the source GeoTIFF.
- **Rover track snapshot**: fetched the verified MMGIS `M20_waypoints.json` feed (589 kB) and
  committed it to `public/data/` with a generated-at timestamp in the metadata.
- **2D explorer**: viewport-aware tile compositor, pan/zoom (pointer drag + wheel), HiRISE/CTX
  layer toggles, live attribution panel, honest degradation notes for failed tiles, SVG rover-track
  overlay.
- **3D terrain view**: R3F custom shader material displaces a plane by the RG heightmap and colors
  it by slope class; OrbitControls; vertical-exaggeration slider (1–6×).
- **Cursor inspection panel**: lat/lon, elevation (measured), slope (derived) with slope-class badge.
  Verified readout at Jezero center: −2568.6 m / 0.4°, consistent with published Perseverance site
  elevations around −2545 to −2600 m relative to MOLA areoid.
- **Failure surfaces / honesty**: tile-fetch failure → dark patches + count; no fabricated elevation;
  all DEM-derived values labeled `measured` or `derived` in the UI and metadata.
- Quality gates: typecheck ✓ · lint ✓ · Vitest 42/42 ✓ · build exit 0; browser walkthrough with
  zero console errors.
