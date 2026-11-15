# ARES — Mars Mission Explorer

> **Explore Mars. Plan Smarter. Survive Further.**
> NASA Space Apps Challenge 2026 — *Interplanetary Survival Guide: Martian Map*

ARES is an interactive, scientifically grounded Mars exploration and mission-planning platform.
It combines real NASA/ESA/USGS planetary data, interactive 3D visualization, terrain-hazard
analysis, safe route planning (A* over terrain cost), and a Marswalk mission simulator with an
explicit, documented scientific basis.

**Status:** Shipped product — a public-facing Mars exploration and Marswalk planning
platform centered on Jezero Crater. All modules are live: global 3D globe, Jezero surface
explorer with real HiRISE/CTX tiles and USGS CTX 20 m DEM, slope-based hazard analysis,
A* route planner, and Marswalk simulator. See [`PROJECT_STATUS.md`](PROJECT_STATUS.md)
for the latest verification results.

---

## What ARES does

| Capability | Purpose | Status |
| --- | --- | --- |
| **Mission Dashboard** | Mission control overview: planetary statistics, featured sites, data-source status | Live |
| **Interactive Mars Globe** | Real-texture 3D globe with markers, atmosphere and quality tiers | Live |
| **Surface Explorer** | Jezero Crater in 2D/3D: imagery, elevation, layers, terrain panels | Live |
| **Points of Interest** | Searchable, source-cited collection of Martian exploration sites | Live |
| **Hazard Analysis** | Slope-derived terrain difficulty with documented criteria | Live |
| **Route Planner** | A* pathfinding over terrain-cost grid; route comparison + profiles | Live |
| **Marswalk Simulator** | Oxygen budget, duration, return feasibility → READY / CAUTION / NO-GO | Live |
| **Data Sources** | Full transparency: provider, instrument, resolution, coverage, kind, credits | Live |

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

- NASA **Mars Trek WMTS** tiles — global + regional (MOLA, Viking, HRSC, THEMIS, Jezero HiRISE
  25 cm, Jezero CTX 6 m; `https://trek.nasa.gov/tiles/Mars/EQ/...`, verified HTTP 200)
- USGS **Mars 2020 TRN CTX DTM Mosaic** — Jezero 20 m elevation (processed into committed
  heightmap + slope PNGs for fast browser access)
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
