# ARCHITECTURE

How ARES is structured and why. File-tree changes must be reflected here.

## 1. Layering

```text
┌──────────────────────────────────────────────────────────┐
│ app/ (routing, providers)   features/ (pages, sections)  │  UI layer
├──────────────────────────────────────────────────────────┤
│ components/ui, layout      (design-system primitives)   │
├──────────────────────────────────────────────────────────┤
│ stores/ (zustand)     hooks/   utils/                   │  state & pure helpers
├──────────────────────────────────────────────────────────┤
│ engines/  (pure TS: terrain, pathfinding, safety, sim)   │  science layer
├──────────────────────────────────────────────────────────┤
│ services/nasa/  (providers, data catalog, tile builders) │  data layer
├──────────────────────────────────────────────────────────┤
│ data/ (curated, zod-validated, source-cited)             │
└──────────────────────────────────────────────────────────┘
```

Rules:

1. **UI never computes science.** Components render results produced by `engines/` or `utils/`.
2. **Services never render.** Providers fetch/validate/cache; features consume via TanStack Query.
3. **Engines are pure.** No React, no DOM, no network — deterministic, unit-tested.
4. **`data/` is curated truth.** Validated with zod at module load; every entry source-cited.
5. Dependencies point downward only; features may import anything, engines/services never
   import from features.

## 2. Directory map (current)

```text
src/
├── app/
│   ├── App.tsx                 AppShell + routes
│   ├── routes.tsx              route table with lazy feature pages
│   └── providers.tsx           QueryClientProvider + BrowserRouter
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx        header/nav/outlet/footer chrome
│   │   ├── TopNav.tsx          desktop navigation
│   │   ├── MobileNav.tsx       drawer navigation (Radix Dialog)
│   │   ├── ModuleStatusPage.tsx honest per-module status page (Phase 1)
│   │   └── ErrorBoundary.tsx
│   └── ui/                     button, badge, card, dialog, separator, skeleton,
│                               tooltip, status-badges, section-heading
├── features/
│   ├── dashboard/              hero, module grid, stats, featured POIs, program, data strip
│   ├── globe/                  3D Mars globe (live since Phase 2)
│   │   ├── GlobePage.tsx       orchestration, HUD wiring, honest footer
│   │   ├── GlobeCanvas.tsx     WebGL probe, Canvas, scene error boundary
│   │   ├── GlobeHud.tsx        overlay: layers, quality, legend, attribution, cursor
│   │   ├── GlobeSiteRail.tsx   keyboard-accessible "jump to site" chips
│   │   ├── GlobeFallback.tsx   honest failure surface (flat live mosaic + explanation)
│   │   ├── composeMosaic.ts    verified tiles → canvas (concurrency, retry, degradation)
│   │   ├── useGlobeMosaic.ts   TanStack Query cache per (layer, zoom)
│   │   ├── math.ts             PURE: projection, tile pyramid, tiers, graticule, 3D colors
│   │   └── scene/              MarsScene, MarsGlobeMesh, AtmosphereShell, GraticuleMesh,
│   │                           PoiMarkers (imports three; the only three-touching UI layer)
│   ├── mars-explorer/          Jezero surface explorer (live since Phase 3)
│   │   ├── ExplorerPage.tsx    2D/3D orchestration, layer manager, cursor readout
│   │   ├── TileMap.tsx         2D slippy-map canvas (pan/zoom, wheel as active listener)
│   │   ├── TerrainScene.tsx    3D displaced terrain (custom RG heightmap shader)
│   │   ├── ExplorerHud.tsx     layer/view toggles, attribution, elevation/slope readout
│   │   ├── regionConfig.ts     Jezero bbox, layers, DEM + rover-track paths
│   │   ├── useTileMosaic.ts    viewport tile compositor + TanStack Query cache
│   │   ├── elevationSampler.ts cursor elevation/slope lookup from pipeline PNGs
│   │   ├── roverTrack.ts       MMGIS waypoint parser
│   │   └── useRoverTrack.ts    TanStack Query wrapper for the snapshot
│   ├── points-of-interest/     Atlas: search/filter/detail (live since Phase 1)
│   ├── hazard-analysis/        Phase 4
│   ├── route-planner/          Phase 4
│   ├── mission-simulator/      Phase 5
│   └── data-sources/           registry UI (live since Phase 1)
├── services/nasa/
│   ├── marsTrekProvider.ts     verified WMTS tile URL builder + layer descriptors
│   ├── dataCatalog.ts          typed registry over data/datasets.ts
│   └── types.ts
├── stores/uiStore.ts
├── hooks/usePrefersReducedMotion.ts
├── types/                      geo.ts, poi.ts, dataset.ts (zod schemas + TS types)
├── data/                       places.ts, datasets.ts, planetaryFacts.ts, program.ts
├── utils/                      cn.ts, geo.ts, format.ts
├── styles/globals.css          Tailwind v4 @theme tokens + base/components
├── main.tsx
└── scripts/                    dev-time data pipelines
    └── build-jezero-terrain.mjs   Node geotiff.js + sharp DEM → heightmap/slope/metadata

public/data/                    committed pipeline outputs + snapshots
├── jezero_ctx_dem_20m.tif      source USGS CTX DTM (committed for reproducibility)
├── jezero_heightmap_rg16.png   RG-encoded 16-bit elevation heightmap
├── jezero_slope_degrees.png    8-bit grayscale slope grid
├── jezero_metadata.json        source, bbox, encoding, thresholds
└── M20_waypoints.json          MMGIS Perseverance waypoint snapshot
```

## 3. Data flow examples

**Tiles → pixels (Phase 2/3, live):** feature → `services/nasa/marsTrekProvider.buildTrekTileUrl()`
→ TanStack Query composites verified tiles onto a canvas (`features/globe/composeMosaic.ts` for
the globe; `features/mars-explorer/useTileMosaic.ts` for regional viewport maps, D-011) → R3F
`CanvasTexture` or 2D canvas → renderer; attribution rendered with the layer descriptor in the HUD.
Regional layers include per-layer min/max zoom and bbox parsed from GetCapabilities.

**DEM → heightmap/slope (Phase 3, live):** USGS GeoTIFF → Node script
`scripts/build-jezero-terrain.mjs` (`geotiff.js` + `sharp`) → `public/data/` RG-encoded heightmap,
grayscale slope PNG and metadata JSON → `TerrainSampler` for cursor readout and R3F custom shader
for 3D displacement.

**Catalog → UI (Phase 1, live):** `data/places.ts` (zod-validated) → `features/points-of-interest`
components → Atlas page/dashboard. No runtime fabrication.

**Mission sim (Phase 5, planned):** UI collects `MissionConfig` (zod) → `engines/simulation`
computes `MissionResult` → UI renders verdict + assumptions; nothing mutates the input silently.

## 4. State ownership

| State | Owner | Rationale |
| --- | --- | --- |
| Router location | react-router | URL is the source of truth |
| Query caches | TanStack Query | dedupe, retry, invalidation |
| UI/session prefs (nav drawer, units, toggles) | zustand `uiStore` | tiny, synchronous |
| Feature-local state | component state | keep it local unless shared |
| Curated data | `data/` modules | static, zod-validated |

## 5. Rendering strategy (Phases 2–3)

- Three.js bundles are `React.lazy` code-split; the rest of the app never imports them.
- Terrain rendering uses GPU displacement from PNG heightmaps (16-bit height split across
  R/G channels — the approach proven by the reference project) to stay web-host friendly.
- Quality tiers (high/medium/low) choose texture sizes and mesh density; adaptive resolution
  monitors frame time (see `DEVELOPMENT_ROADMAP.md` Phase 2 acceptance criteria).
- Every WebGL object is disposed on unmount; a single render loop per scene.

## 6. Error & failure policy

| Failure | Behavior |
| --- | --- |
| Tile/image fetch fails | layer shows fallback + "data unavailable" note (never blank) |
| WebGL unavailable | static fallback visual + explanation |
| Catalog schema invalid | build/test fails (zod throws at import in dev) |
| External API error | cached last-good + error chip; no fake data substitution |
