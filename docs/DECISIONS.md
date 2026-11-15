# DECISIONS

Architecture/decision log. New decisions append; changes update the entry with date.

## D-001 — Manual scaffold instead of `create-vite` (2026-11-14)
`npm create vite` is interactive here and would still need cleanup; writing the 12 config files
by hand is deterministic, reviewable, and identical to the template output plus our strictness
flags. **Consequence:** full ownership of tsconfig (project references, strict flags).

## D-002 — Tailwind CSS v4, CSS-first tokens (2026-11-14)
No `tailwind.config.js`; design tokens live in `styles/globals.css` `@theme`. Aligns with
Tailwind's current direction; keeps one source of truth for the design system. Consequence:
components reference tokens as utilities (`bg-space`, `text-cyan`).

## D-003 — No backend for the MVP (2026-11-14)
Static curated data + public NASA tile services cover Phases 1–4. A serverless function is
added only if a keyed API must be hidden (e.g. DONKI) or CORS blocks verified tiles.
Consequence: cheapest hosting (static), zero ops, transparent data flow.

## D-004 — Dark-only UI (2026-11-14)
The product is a night-time mission-control instrument; a light theme doubles QA cost and
dilutes the identity. `color-scheme: dark` set globally; no theme toggle.

## D-005 — Hand-written shadcn-style primitives (2026-11-14)
shadcn/ui's value is copyable code, which we author directly (cva + Radix) to match our tokens
exactly and avoid CLI config drift. Consequence: `components/ui/*` is ours to maintain.

## D-006 — Verified-data-only policy (2026-11-14)
No endpoint, layer ID, coordinate or measurement enters `src/data/` without an HTTP check or a
published citation; unverified items are `pending-verification` and surface as such.
Consequence: the data catalog is smaller but unimpeachable; grows per phase.

## D-007 — Vitest (not Jest) (2026-11-14)
Native ESM + shared Vite transforms; zero dual-config. RTL for components; Playwright deferred
to Phase 6 for E2E (not needed to validate Phase 1 flows).

## D-008 — Node data pipeline instead of Python (2026-11-14)
This environment has no Python (verified). The DEM→heightmap pipeline will use `geotiff.js`
(reads PDS GeoTIFFs) + `sharp` (PNG encode), run as a dev-time script producing committed
artifacts under `public/data/`. Same outputs as the reference project's Python pipeline.

## D-009 — Region-first expansion (2026-11-14)
Deep, high-quality support for one region (Jezero) beats shallow coverage of many; the region
config pattern (`RegionConfig` → data paths → layers → POIs) makes additional regions a data
task, not a code task. Consequence: globe covers the planet, explorer is region-scoped.

## D-010 — Longitude convention: east-positive ±180 with per-entry conversion notes (2026-11-14)
Gazetteer/Trek sources use 0–360°E; UI displays ±180 with E/W. Conversions happen once in
`data/` with comments, so downstream code and tests see one convention.

## D-011 — Globe texture = client-side composite of verified WMTS tiles (2026-11-14)
No verified single-image endpoint exists for a global Mars texture; the verified source is the
WMTS tile service. The globe therefore composites tiles onto a canvas in the browser
(`features/globe/composeMosaic.ts`, concurrency-limited, one bounded retry, failed tiles stay
dark and are counted). Trek serves `Access-Control-Allow-Origin: *` (verified), so the canvas is
WebGL-safe without a server. **Consequence:** zero infrastructure, honest `derived` labeling,
session-cached composites; a self-hosted pre-composed texture remains the fallback if Trek
ever adds CORS restrictions.

## D-012 — Perseverance raw-images gallery uses the reverse-engineered `mars.nasa.gov/rss/api` feed (2026-11-14)
The documented NASA Mars Rover Photos API (`api.nasa.gov/mars-photos/api/v1`) is offline
(Heroku 404). The official gallery's JS bundle calls an undocumented `/rss/api/?feed=raw_images&...`
JSON endpoint that is live and CORS-open. ARES may consume it for a rover-images panel, but it
must be labeled as an unofficial endpoint with a graceful failure path. Individual images have
no verified lat/lon in the feed, so they are shown in a gallery only, not placed on the map.

## D-013 — Consolidate vendor libraries into a single UI chunk to eliminate circular chunks (2026-11-15)
The previous manual-chunk strategy split `@radix-ui`, `lucide-react`, `recharts`, and `d3` into
separate `vendor-ui` / `vendor-charts` / `vendor-misc` chunks. This produced circular chunk
references (`vendor-misc ↔ vendor-ui ↔ vendor-charts`) that caused a runtime error in the
production build (`TypeError: P is not a function` inside `vendor-charts`). **Fix:** route all
non-React / non-Three / non-Query / non-Zod node_modules into `vendor-ui`. This removes the
cycles, keeps the build passing, and keeps cacheable separation for the largest frameworks.
**Consequence:** `vendor-ui` is ~500 kB minified / ~150 kB gzip, but it is fetched only once and
is stable across releases.

## D-014 — Global base maps in the Explorer are clamped to their verified max zoom (2026-11-15)
Verified NASA Mars Trek global layers do not all serve the same zoom range. Live HEAD checks
showed: MOLA color hillshade and Viking MDIM21 serve zoom 0–7; MOLA+HRSC blend serves 0–8;
THEMIS Night IR serves 0–9; MOLA roughness serves 0–7. Requesting tiles beyond a layer's range
returns 404. **Fix:** store `minZoom`/`maxZoom` on every `TrekLayer` and clamp tile requests to
that range in the Explorer. When the viewport zoom exceeds the base-map max, the base map is
scaled up (it becomes blurry) while the regional overlay stays sharp. **Consequence:** the global
base map is always visible as geographic context, never floats on a black void, and never
fabricates high-zoom tiles.

## D-015 — Hazards uses client-side terrain-derivative clustering with a 50,000 m² minimum-area filter (2026-11-15)
To move Hazards from a simple slope overlay to an explainable terrain-risk intelligence system,
ARES now computes slope, TRI, roughness, relief, and aspect from the committed CTX 20 m DEM at
runtime, then classifies every cell against a configurable mobility profile. Neighboring
moderate-or-higher risk cells are grouped by 8-connected component analysis so that thousands of
individual pixels are summarized as discrete, inspectable hazard clusters. A 50,000 m²
minimum-area filter removes small noise fragments caused by DEM stair-stepping, leaving
operationally meaningful regions. **Why 50,000 m²?** At 20 m/px this is 125 cells, roughly
50 × 100 m — smaller than a football pitch and well above pixel-level artifacts, yet small enough
to retain narrow ridge/valley hazards. The filter is exposed as `HazardDetectionOptions` so tests
can use `0` for deterministic micro-grids. **Consequence:** Hazards inventory shows 40 real
clusters on the Jezero DEM (Standard profile), each with area, dominant category, severity,
min/max elevation, and slope/roughness/relief statistics; no fabricated hazard coordinates.

## D-016 — Route path nodes persist with their cost-grid dimensions (2026-11-15)
The Planner's A* runs on a downsampled cost grid (default 256×243 cells) that shares the DEM
bbox, while Hazards analyzes the full-resolution grid (1596×1512). The original handoff stored
only the bare path array, so Hazards mapped cost-grid node indices onto the full-resolution
grid — compressing all distances by 1596/256 ≈ 6.2× (a real 2.8 km route reported as 0.46 km)
and sampling terrain at the wrong cells. **Fix:** `ares:planner-route-path` now stores
`{ path, gridWidth, gridHeight }`; `computeRouteExposure` accepts an optional `PathGridExtent`
and converts node indices to lat/lon through the path's own grid, then samples the
full-resolution analysis geographically. A legacy bare-array format is still parsed (assumed to
index the full-res grid) for backward compatibility. A regression test pins the 0.001°-bbox
distance. **Consequence:** Planner and Hazards now agree on route distance (2.82 vs 2.87 km —
the residual is the exposure segment rounding), and the route overlay draws at the correct map
position. The persisted route survives without the simulator summary key, which the Simulator
consumes on import.

## D-017 — Hazards workspace is UI-layer only; the hazard engines stay untouched (2026-11-15)
The Phase 6 premium redesign rewrote `HazardsPage` and its components but deliberately did not
modify the verified scientific engines (`terrainAnalysis.ts`, `riskModel.ts`, `hazardDetection.ts`,
`routeExposure.ts` math). All UI visual language (map outlines, inventory cards, charts,
highlights) derives its colors from the engine constants (`SEVERITY_COLORS`, `CATEGORY_COLORS`)
— components never hardcode hazard hex values. Cluster severity remains max-member severity
(engine-defined), which means under the Standard profile all 40 retained clusters classify
Critical; the UI presents this honestly rather than re-labeling it.

## D-018 — MMGIS waypoint parser accepts both string and array coordinates (2026-11-15)
The live MMGIS `M20_waypoints.json` feed serializes `geometry.coordinates` as a
space-separated `"lon lat elev"` string, but the committed snapshot (used offline and in tests)
uses a `[lon, lat, elev]` array. The original parser only handled the string form and silently
dropped every waypoint of the snapshot (crash-free but empty track). **Fix:** `parseRoverWaypoints`
normalizes both forms; malformed entries are skipped, not fabricated. **Consequence:** the
Perseverance traverse overlay renders from the committed snapshot in all modules.


