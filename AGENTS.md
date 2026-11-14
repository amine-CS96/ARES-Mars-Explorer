# AGENTS.md — ARES: Mars Mission Explorer

> **Read this file first in every new session.** Then read `PROJECT_STATUS.md` for the current
> state of development. Do not start coding before you have read both and the relevant docs in
> `docs/` for the module you are touching.

**Project:** ARES — Mars Mission Explorer
**Tagline:** *Explore Mars. Plan Smarter. Survive Further.*
**Challenge:** NASA Space Apps Challenge 2026 — *Interplanetary Survival Guide: Martian Map*
**Repository root:** `C:\Users\Amine\My_Documents\NASA_SPACE_Challenge_2026\Martian_Map`

---

## 1. Project identity

ARES is an interactive, scientifically grounded Mars exploration and mission-planning platform.
It lets users explore Mars in 2D and 3D, understand terrain and hazards, discover scientific
points of interest, plan safer exploration routes with A* pathfinding over real terrain data,
and simulate a Marswalk (oxygen budget, duration, return feasibility).

It answers: *Where are the mountains, valleys, craters? Which regions are dangerous? What is the
elevation and slope? Where are the interesting science sites? What is the safest route between
two points? Can an astronaut complete the planned Marswalk with available resources?*

**Scientific credibility rules (non-negotiable):**

1. Use real NASA / ESA / USGS / JPL data wherever possible.
2. Every coordinate, dataset, endpoint and scientific value must carry a source reference.
3. Never fabricate measurements, API endpoints, tile URLs, layer IDs or mission data.
4. Clearly label every value as `measured`, `derived`, `estimated` or `simulated`, and every
   coordinate as `verified`, `approximate` or `illustrative`.
5. Route and Marswalk outputs are planning estimates, never certified flight-safety products.
6. If data cannot be retrieved, ship a transparent fallback — never fake the real thing.
7. Attribute NASA/JPL/USGS/ESA/DLR/ASU/MSSS/UArizona on every data view.

## 2. Technology stack

| Layer | Choice |
| --- | --- |
| Frontend | React 19 + Vite 7 + TypeScript (strict) |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`), CSS-first `@theme` tokens |
| UI primitives | Hand-written shadcn-style components on Radix UI + `class-variance-authority` |
| 3D (Phase 2+) | Three.js via React Three Fiber + `@react-three/drei`, custom GLSL when justified |
| Charts (Phase 4+) | Recharts |
| State | Zustand (UI/session state), TanStack Query (async data, caching, retries) |
| Validation | Zod (schemas for POIs, datasets, mission configs) |
| Routing | react-router-dom v7 |
| Icons | Lucide React |
| Testing | Vitest + React Testing Library; Playwright planned for E2E |
| Quality | ESLint (flat config) + Prettier |

Data engineering (Phase 3): the plan is a **Node** pipeline (`geotiff.js` + `sharp`) to convert
USGS PDS GeoTIFF DEMs into web heightmaps, because this environment has **no Python**. See
`docs/DATA_SOURCES.md` and `docs/DECISIONS.md` (D-008).

## 3. Commands

> Windows note: PowerShell blocks `npm.ps1` (execution policy). Use `npm.cmd` or run
> `npm` from cmd.exe. Never commit a "fix" that hardcodes `npm.cmd` into scripts.

```powershell
npm.cmd install        # install dependencies
npm.cmd run dev        # Vite dev server → http://localhost:5173
npm.cmd run build      # tsc -b && vite build → dist/
npm.cmd run preview    # serve dist/ → http://localhost:4173
npm.cmd run typecheck  # tsc -b (strict, no emit)
npm.cmd run lint       # eslint .
npm.cmd run test       # vitest run (single pass)
npm.cmd run test:watch # vitest watch
npm.cmd run format     # prettier --write .
```

Definition of done for any feature: `typecheck` ✓, `lint` ✓, `test` ✓, `build` ✓, and the
feature verified in the running app (dev server + browser) before marking anything complete.

## 4. Architecture (map before you code)

```text
src/
├── app/            App.tsx, routes.tsx, providers.tsx — routing + global providers
├── components/
│   ├── layout/     AppShell, TopNav, MobileNav, ModuleStatusPage, ErrorBoundary
│   └── ui/         button, badge, card, dialog, separator, skeleton, tooltip, status-badges
├── features/       one folder per module; owns its pages/sections/state wiring
│   ├── dashboard/            Module A
│   ├── globe/                Module B (Phase 2)
│   ├── mars-explorer/        Module C (Phase 3)
│   ├── points-of-interest/   Module D (data-driven, live since Phase 1)
│   ├── hazard-analysis/      Module E (Phase 4)
│   ├── route-planner/        Module F (Phase 4)
│   ├── mission-simulator/    Module G (Phase 5)
│   └── data-sources/         Module H (data-driven, live since Phase 1)
├── engines/        pure-TS logic: terrain, pathfinding, safety, simulation, rendering (Phase 4+)
├── services/nasa/  marsTrekProvider, dataCatalog, imagery/elevation providers, types
├── stores/         zustand stores (uiStore…)
├── types/          geo, poi, dataset, mission types + zod schemas
├── data/           curated, source-cited static data (places, datasets, planetaryFacts, program)
├── utils/          cn, geo math, formatting
├── styles/         globals.css (Tailwind v4 @theme design tokens)
└── main.tsx
```

Layering rules:

- **UI components** never contain scientific calculations — they call `engines/` or `utils/`.
- **Data retrieval** (`services/`) is separate from rendering. Providers own caching/retries.
- **`data/` is curated, not invented**: every entry validated by a zod schema and source-cited.
- Cross-module imports go through public entry points only (no deep-reaching into feature
  internals). Prefer `features/<m>/index.ts` barrels when a module grows.

## 5. Conventions

- TypeScript strict; `type` imports with `verbatimModuleSyntax` (`import type { X }`).
- Path alias `@/` → `src/`.
- Components: PascalCase files (`TopNav.tsx`); hooks `useThing.ts`; tests co-located
  (`*.test.ts(x)` next to the unit under test).
- No default exports for components (except `App`); named exports everywhere.
- Numeric display in `JetBrains Mono`; coordinates formatted via `utils/geo.ts` helpers only.
- Design tokens only from `styles/globals.css` `@theme` — never hardcode hex in components.
- Zod-validate anything that crosses a boundary (fetched data, curated data at module load).
- Keep components small; split sections into their own files.

## 6. Data & endpoints (verified — do not invent others without checking)

- Mars Trek WMTS tile template (verified live, HTTP 200):
  `https://trek.nasa.gov/tiles/Mars/EQ/{LAYER}/1.0.0/default/default028mm/{Z}/{ROW}/{COL}.{jpg|png}`
- Verified global layer IDs: `Mars_MGS_MOLA_ClrShade_merge_global_463m` (jpg),
  `Mars_Viking_MDIM21_ClrMosaic_global_232m` (jpg),
  `Mars_MOLA_blend200ppx_HRSC_ClrShade_clon0dd_200mpp_lzw` (jpg),
  `THEMIS_NightIR_ControlledMosaics_100m_v2_oct2018` (png), `mola_roughness` (png).
- Trek layer catalog (146 products, fetched from TrekServices `searchItems`) is the source of
  truth for layer metadata; regional layers (e.g. Jezero HiRISE 25 cm) require reading each
  layer's WMTS GetCapabilities to get the correct matrix set/zoom range — do not guess.
- MMGIS Perseverance waypoints (verified HTTP 200):
  `https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_waypoints.json`
- NASA fact sheet (planetary values): `https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html`

Full registry with statuses lives in `src/data/datasets.ts` + `docs/DATA_SOURCES.md`.

## 7. Workflow rules for every session

1. **Read** `AGENTS.md` (this file) and `PROJECT_STATUS.md` before any change.
2. **Read** the relevant `docs/*.md` for the module (architecture, data sources, models).
3. **Implement** following the layering rules and conventions.
4. **Verify**: typecheck, lint, tests, build; run the app and visually check affected flows.
5. **Update docs** after every significant change: `PROJECT_STATUS.md`, `CHANGELOG.md`, and the
   relevant module docs. New architecture decision → `docs/DECISIONS.md`.
6. Never leave broken imports/routes or half-finished features on the main branch.
7. Never delete or overwrite existing work without justification; treat unfamiliar files as
   user work and investigate first.

## 8. Roadmap phase gates

Phases and their acceptance criteria are in `docs/DEVELOPMENT_ROADMAP.md`. Current phase is
always recorded at the top of `PROJECT_STATUS.md`. Do not skip ahead of a phase's DoD.

## 9. License & attribution

Code is Apache-2.0 (Space Apps requirement). NASA imagery/data are generally not copyrighted but
must be credited. The Sol Atlas repository (Apache-2.0) was studied as a reference; no code was
copied. See `docs/DATA_SOURCES.md` → Credits.
