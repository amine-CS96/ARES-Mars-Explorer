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
│   ├── globe/                  Phase 2 (ModuleStatusPage for now)
│   ├── mars-explorer/          Phase 3
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
├── types/                      geo.ts, poi.ts, dataset.ts (zod schemas + TS types)
├── data/                       places.ts, datasets.ts, planetaryFacts.ts, program.ts
├── utils/                      cn.ts, geo.ts, format.ts
├── styles/globals.css          Tailwind v4 @theme tokens + base/components
└── main.tsx
```

## 3. Data flow examples

**Tiles → pixels (Phase 2/3):** feature → `services/nasa/marsTrekProvider.buildTrekTileUrl()`
→ TanStack Query fetch/cache → renderer (R3F texture / CSS `<img>`) → attribution line rendered
with the layer descriptor.

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
