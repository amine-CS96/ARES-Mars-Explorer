# ARES — Mars Mission Explorer

> **Explore Mars. Plan Smarter. Survive Further.**
> NASA Space Apps Challenge 2026 — *Interplanetary Survival Guide: Martian Map*

ARES is an interactive, scientifically grounded Mars exploration and mission-planning platform.
It combines real NASA/ESA/USGS planetary data, interactive 3D visualization, terrain-hazard
analysis, safe route planning (A* over terrain cost), and a Marswalk mission simulator with an
explicit, documented scientific basis.

**Status:** Phase 2 of 6 — professional foundation plus the **live 3D Mars globe** (Three.js
planet textured from verified NASA Trek tiles, markers, quality tiers, honest fallbacks), on
top of the Phase 1 design system, dashboard, points-of-interest atlas and data-source registry.
See [`PROJECT_STATUS.md`](PROJECT_STATUS.md) for the live state of development.

---

## What ARES does

| Module | Purpose | Phase |
| --- | --- | --- |
| **Mission Dashboard** | Mission control overview: planetary statistics, featured sites, data-source status | 1 ✓ |
| **Interactive Mars Globe** | Real-texture 3D globe (Three.js), markers, atmosphere, quality tiers | 2 ✓ |
| **Surface Explorer** | Jezero Crater in 2D/3D: imagery, elevation, layers, terrain panels | 3 |
| **Points of Interest** | Searchable, source-cited collection of Martian exploration sites | 1 ✓ (data live) |
| **Hazard Analysis** | Slope/roughness-based terrain difficulty with documented criteria | 4 |
| **Route Planner** | A* pathfinding over terrain-cost grid; route comparison + profiles | 4 |
| **Marswalk Simulator** | Oxygen budget, duration, return feasibility → READY / CAUTION / NO-GO | 5 |
| **Data Sources** | Full transparency: provider, instrument, resolution, coverage, kind, credits | 1 ✓ (registry live) |

Everything scientific in ARES is traceable: every coordinate carries an accuracy label
(`verified` / `approximate` / `illustrative`), every dataset its provider, instrument and
resolution, and every model its assumptions. ARES is an educational planning tool — **not** an
operational astronaut-safety system.

## Quick start

```powershell
npm.cmd install
npm.cmd run dev      # → http://localhost:5173
```

Other commands:

```powershell
npm.cmd run build        # production build (dist/)
npm.cmd run preview      # serve the production build
npm.cmd run typecheck    # strict TypeScript check
npm.cmd run lint         # ESLint
npm.cmd run test         # Vitest (unit + component)
npm.cmd run format       # Prettier
```

> Windows + PowerShell: scripts must be invoked as `npm.cmd` because the execution policy
> blocks `npm.ps1`. From cmd.exe plain `npm` works.

## Documentation system

This project maintains a permanent documentation system for humans and AI sessions:

- [`AGENTS.md`](AGENTS.md) — **start here**: instructions, stack, rules for AI sessions
- [`PROJECT_STATUS.md`](PROJECT_STATUS.md) — current development state
- [`CHANGELOG.md`](CHANGELOG.md) — chronological history
- [`docs/`](docs/) — overview, requirements, architecture, design system,
  [data sources](docs/DATA_SOURCES.md), [scientific models](docs/SCIENTIFIC_MODELS.md),
  [route planning](docs/ROUTE_PLANNING.md), roadmap, testing strategy, decisions log

## Data (verified live during development)

- NASA **Mars Trek WMTS** tiles — MOLA color hillshade, Viking MDIM 2.1, HRSC blend, THEMIS IR
  (`https://trek.nasa.gov/tiles/Mars/EQ/...`, verified HTTP 200)
- NASA/JPL **MMGIS** Perseverance waypoint feed (`M20_waypoints.json`, verified HTTP 200)
- NASA **NSSDCA Mars fact sheet** for planetary statistics
- USGS **Gazetteer of Planetary Nomenclature** for feature coordinates

Full registry with provider/instrument/resolution/status: `/data-sources` in the running app.

## Credits

Data: **NASA/JPL-Caltech**, **NASA/USGS Astrogeology**, **NASA/GSFC (MOLA)**,
**NASA/JPL/ASU (THEMIS)**, **NASA/JPL/MSSS (CTX)**, **NASA/JPL/UArizona (HiRISE)**,
**ESA/DLR/FU Berlin (Mars Express HRSC)**, **NASA GISS (Mars24)**.
References studied: NASA Mars Trek, Sol Atlas (Apache-2.0 — inspiration only, no code copied).

ARES is an independent educational project and is not affiliated with or endorsed by NASA.
Code licensed **Apache-2.0** (see [`LICENSE`](LICENSE)).
