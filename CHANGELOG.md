# Changelog

All notable changes to ARES — Mars Mission Explorer.

## Phase 6.1 — Hazards workspace redesign & route-handoff fixes (2026-11-15)

### Redesigned Hazards into a professional GIS-style hazard-intelligence workspace

- New three-part layout: compact analysis header (region, DEM provenance, live metric chips,
  Methodology dialog / Export menu / Reset), collapsible left analysis controls (mobility
  profile, terrain layer with per-layer legend/unit/method, map features, base imagery), a
  dominant map canvas, and a right panel with Inventory / Assessment / Analytics / Route tabs.
- Selecting a cluster or map point replaces the tabs with an explainable inspector: "Why
  Critical?" factor contributions using the model's real ramp × weight math
  (`computeFactorContributions`), measured-vs-derived labeling, nearest verified POI distances,
  and a back-to-inventory action.
- Inventory rebuilt: summary metrics, functional severity/factor/area/slope filters, sorting,
  ID search, compact severity-accented cards; hover previews the cluster on the map, selection
  highlights, centers, and inspects it.
- Map: severity-colored SVG cluster outlines with hover/selection/analytics-highlight states,
  route geometry overlay (severity-colored segments, start/end markers), optional Perseverance
  traverse overlay (committed MMGIS snapshot), cursor-following terrain tooltip (lat/lon,
  elevation, slope, roughness, relief, live classification), scale bar and coordinate bar.
- Assessment tab: regional stats, severity + dominant-factor distributions, accessible vs
  restricted area under the active profile, three-profile mobility comparison, limitations.
- Analytics tab: cluster-count/area by severity, dominant-factor breakdown, max-slope /
  roughness / relief histograms; clicking a severity or factor bar highlights the matching
  clusters on the map (clearable).
- Real JSON + CSV analysis export (provenance, profile, thresholds/weights, per-cluster stats,
  route exposure, methodology, limitations) via Blob download; no fabricated export fields.

### Cross-module route handoff — two real bugs found and fixed

- **routeExposure coordinate mapping (D-016):** path nodes index the Planner's cost grid
  (256×243) but were converted through the full-resolution grid (1596×1512), compressing route
  distances by ~6.2× (2.82 km route reported as 0.46 km) and sampling the wrong cells. The
  persisted route now carries its grid dimensions and `computeRouteExposure` maps nodes through
  the correct extent before sampling the full-res analysis. Verified: Planner 2.82 km ↔ Hazards
  2.87 km.
- **MMGIS waypoint parser (D-018):** the committed `M20_waypoints.json` snapshot stores
  coordinates as `[lon, lat, elev]` arrays while the parser only accepted `"lon lat elev"`
  strings, silently emptying the Perseverance traverse. The parser now accepts both forms.

### Related fixes & improvements

- Planner persists every computed route (path + grid size + enriched summary), not only on
  explicit "Send to Simulator"; Reset clears the handoff keys.
- Hazards reads the route from the path key alone; the simulator summary is optional (the
  Simulator consumes it after import) and `totalEnergyKJ` is now optional in `RouteSummary`.
- Route exposure reuses the page's precomputed terrain analysis instead of re-running the
  ~603k-cell pass, and accessibility is memoized per analysis (not per profile switch).
- Profile switching consistently updates clusters, classification, inventory, header metrics,
  assessment, analytics, route exposure and cursor tooltip; slope/roughness/relief values are
  profile-independent (measured DEM quantities).
- Honest empty states: the Route tab explains there is no stored route and links to the Planner.
- E2E: new `e2e/hazards.spec.ts` (cluster→inspector, analytics highlight, route empty state,
  reference screenshots at 1920×1080 / 1440×900 / 1024×768 / 390×844) — 42 passed / 2 skipped
  across desktop-chrome + mobile-chrome projects.
- Verification gates: typecheck ✓, lint ✓, Vitest 105/105 ✓, production build ✓.

## Phase 6 — Final product polish & demo (2026-11-15)

### Premium Hazards & Terrain Risk Analysis transformation

- Rebuilt Hazards as a full-screen terrain-intelligence workspace with a compact header, top
  toolbar, collapsible left analysis panel, right inventory/assessment/charts panel, inspector,
  and bottom coordinate bar.
- Implemented a real multi-layer terrain analysis engine (`src/engines/hazards/`):
  - Slope recomputed from the DEM with Horn finite differences.
  - Terrain Ruggedness Index (TRI), local roughness (std dev), and local relief over a
    configurable window.
  - Aspect (direction of steepest descent).
  - Explicit nodata/boundary masking so missing data is never treated as safe.
- Implemented dynamic hazard detection with connected-component clustering (8-connected),
  severity ranking, cluster statistics, and a 50,000 m² minimum-area filter to remove noise
  fragments.
- Added a transparent, configurable mobility-profile risk model: Conservative, Standard, and
  Capable profiles with documented slope/roughness/relief thresholds and weights.
- Added professional analytical panels: hazard inventory with severity filtering, detailed
  hazard inspector, area assessment with coverage and severity distribution, and Recharts
  severity/category charts.
- Added terrain overlay canvas builders for slope, roughness, relief, aspect, combined risk,
  and hazard cluster boundaries.
- Integrated with Planner: the Planner now persists route path nodes; Hazards loads the latest
  route and computes per-segment terrain exposure, severity percentages, and cluster
  intersections, with a "Send to Simulator" action.
- Added "Plan route near cluster" action that opens the Planner centered on a selected hazard.
- Added 28 new unit tests covering terrain analysis, risk scoring, hazard clustering, and
  route exposure.

### Premium Jezero Explorer transformation

- Rebuilt the Explorer as a full-screen planetary GIS workspace with a compact header, top
  toolbar, collapsible left layer panel, right inspector panel, and bottom status bar.
- Added true global/regional layer composition: a verified NASA Mars Trek global base map
  (MOLA/Viking/MOLA+HRSC/THEMIS/roughness) is always drawn underneath the regional HiRISE/CTX
  overlay, eliminating the black void around regional coverage.
- Implemented overlay opacity slider and per-layer max-zoom clamping so base maps never request
  non-existent tiles.
- Added professional cartographic overlays: dynamic scale bar, lat/lon grid toggle, DEM/imagery
  coverage boundary, and Perseverance traverse toggle.
- Added scientific tools: point inspector with coordinates/DMS/elevation/slope, distance
  measurement between two points, and elevation profile drawn from actual DEM samples.
- Added quick-location jump dropdown for Jezero POIs (landing site, Three Forks, Séítah,
  delta front, crater center).
- Improved 3D terrain view with starfield, hemisphere + directional lighting, DEM coverage
  boundary line, and a context plane below the DEM.
- Added attribution and tile-loading status to the bottom coordinate bar.

### Public-facing product cleanup

- Removed all public "Phase X" and "Module X" labels from page eyebrows, dashboard cards, data
  source cards, and navigation.
- Replaced the dashboard `ProgramStatusSection` (internal build timeline) with a public
  `MissionWorkflowSection` showing the user journey: Globe → Explorer → Hazards → Planner →
  Simulator.
- Updated `TopNav` and `MobileNav` phase badge to a "NASA Space Apps 2026" mission label.
- Updated `README.md` and `PROJECT_STATUS.md` to reflect the shipped product state.

### Cross-module workflow

- Added "Explore Jezero Crater" CTA on the Mars Globe page.
- Added "Open in Explorer" and "Plan route here" actions in the Atlas POI detail dialog.
- Added query-param support to Explorer (`?lat=&lon=`) and Planner (`?startLat=&startLon=`
  `&goalLat=&goalLon=`) for cross-module navigation.
- Added a sample route in the Planner (Octavia E. Butler Landing → Three Forks Sample Depot).

### Scientific integrity fixes

- Fixed planner → simulator hand-off to import `averageSlopeDegrees` and `totalEnergyKJ`;
  `estimateOxygen` now uses the DEM-derived average slope when a route is imported.
- Fixed 3D terrain slope-color accuracy by disabling tone mapping on the custom shader material.
- Fixed default 3D elevation range to match the committed Jezero DEM.
- Replaced fabricated rover-track `fetchedAt` timestamp with a static `snapshotLabel`.
- Fixed route cursor sample to label slope as derived, not measured.
- Hardened Hazard Analysis base-layer selection by verified layer ID.

### Build & quality

- Fixed production-build runtime failure caused by circular manual chunks; consolidated UI/chart
  libraries into one vendor chunk.
- Added `overflow-x: hidden` safeguard on `html`/`body`.
- Updated E2E smoke selectors for the new public copy and fixed attribution visibility on mobile.

### Verification

- TypeScript, ESLint, Vitest (68/68), production build, and Playwright E2E smoke (28/28) all pass.

## Phase 5 — Marswalk simulation (2026-11-14)

### Added

- **Simulation engines** (`src/engines/simulation/`)
  - `marsTime.ts` — NASA GISS Mars24 algorithm (Allison & McEwen 2000) implemented directly
    from the GISS reference page: JD(TT) → Mars parameters → Lₛ → equation of time → MSD /
    LMST / LTST, plus subsolar longitude, solar declination and solar elevation.
  - `missionConfig.ts` — zod-validated `MissionConfig` (route, astronaut, suit, O₂ supply,
    reserve, stops) + default config; `RouteSummary` schema and the
    `ares:simulator-route-summary` localStorage key for the planner hand-off.
  - `oxygenModel.ts` — reuses the Phase 4 Pandolf cost model; energy → O₂ volume at
    20.1 kJ/L → mass at 1.429 g/L (gas at STP, documented approximation); point-of-no-return
    with a 1.2× return-path detour factor.
  - `verdict.ts` — READY / CAUTION / NO-GO classification on the O₂ margin.
  - `radiation.ts` — MSL RAD 0.64 mSv/sol context vs. the 600 mSv career limit.
- **Simulator page** (`src/features/mission-simulator/SimulatorPage.tsx`)
  - Live Mars24 clock for Jezero Crater: local true/mean solar time, MSD, Lₛ, season and sun
    elevation, ticking every second.
  - Fully editable config with grouped numeric inputs (route, astronaut & equipment,
    cost-model assumptions, O₂ supply, stops).
  - Results: verdict banner, oxygen budget (required/tank/reserve/available/remaining/margin),
    duration & energy, point-of-no-return, radiation context.
  - Assumptions panel citing Pandolf, the 20.1 kJ/L constant, Mars24 (Allison & McEwen 2000)
    and MSL RAD (Hassler et al. 2014), with persistent "planning estimate, not certified"
    disclaimers.
  - "Load route" fallback plus auto-import of a planner-exported route summary on arrival.
- **Route-planner hand-off** (`src/features/route-planner/PlannerPage.tsx`)
  - "Send to Marswalk simulator" button exports distance, elevation gain/loss (computed from
    the real path elevations), max/average slope and total energy, then navigates to
    `/simulator`.

### Verified

- Mars24 unit tests reproduce both GISS worked examples (epoch case + Spirit landing case).
- `typecheck` 0 errors · `eslint` 0 errors/0 warnings · `vitest` 68/68 passing · `vite build` exit 0.
- Browser walkthrough: `/simulator` renders with zero console errors; the planner → send →
  simulator round trip imports a real 3.45 km route.

## Phase 4 — Terrain analysis & route planning (2026-11-14)

### Added

- **Terrain analysis engine** (`src/engines/terrain/`)
  - `terrainGrid.ts` — loads the USGS CTX 20 m DEM heightmap + slope map into typed numeric grids.
  - `slopeClass.ts` — documented slope thresholds (flat <5°, moderate 5–15°, steep 15–25°,
    hazardous >25°) with colors shared across 2D, 3D and UI.
  - `costGrid.ts` — builds a route-ready downsampled grid with slope recomputed by central
    differences and per-cell difficulty class.
- **Hazard analysis page** (`src/features/hazard-analysis/HazardsPage.tsx`)
  - Live Jezero regional tile map with a derived slope-class overlay.
  - Toggle overlay on/off.
  - Cursor inspector showing elevation, slope and difficulty class with source badges.
  - Legend and explicit limitation statements.
- **A* route planning engine** (`src/engines/pathfinding/`)
  - `astar.ts` — 8-connected A* with binary heap, corner-cut prevention, forbidden-edge pruning.
  - `costModel.ts` — Pandolf-derived metabolic energy model adapted for Mars gravity and an
    editable suit-penalty assumption.
  - `explain.ts` — plain-language route explanation plus straight-line comparison.
- **Route planner UI** (`src/features/route-planner/`)
  - Click-to-set start (green) and destination (orange) on the map.
  - Recommended route + alternative route (penalized re-run) + straight-line comparison.
  - Stats: distance, estimated energy, max/average slope, terrain difficulty breakdown.
  - Elevation profile chart (Recharts) with elevation and slope series.
  - Editable controls: max slope, routing-grid resolution, allow-dangerous toggle, cost-model
    assumptions (body mass, load, speed, suit penalty, terrain factor).
- **Shared map infrastructure** (`src/features/mars-explorer/`)
  - `index.ts` barrel exports `TileMap`, `TerrainScene`, `computeVisibleTiles`, etc.
  - `viewport.ts` — shared lat/lon ↔ pixel helpers.
  - `HazardOverlay.ts` — builds a geographic slope-class raster overlay.
  - `TileMap.tsx` now supports click-to-select and geographic overlay drawing.

### Changed

- `ExplorerHud` now imports slope classes from the engine to guarantee a single source of truth.
- `DATA_SOURCES.md` updated with Phase 4 resource findings.
- `KNOWN_ISSUES.md` and `DECISIONS.md` extended to cover the unofficial Perseverance raw-images
  feed.
- `PROJECT_STATUS.md` moved to **Phase 4 — COMPLETE**.

### Verified

- `typecheck` 0 errors
- `eslint` 0 errors, 0 warnings
- `vitest` 59 tests passing
- `vite build` exit 0
- Browser walkthrough: hazard overlay renders on real tiles; route planner computes and draws a
  route over the Jezero DEM, shows stats and elevation profile with zero console errors.

## Phase 3 — Jezero surface explorer (2026-11-14)

- Regional HiRISE/CTX tile compositor, 2D/3D explorer, cursor elevation/slope readout, rover track.

## Phase 2 — 3D Mars globe (2026-11-14)

- React Three Fiber globe with Trek WMTS textures, atmosphere, POI markers, quality tiers.

## Phase 1 — Application foundation (2026-11-14)

- Scaffold, design system, navigation, dashboard, atlas, data sources registry.
