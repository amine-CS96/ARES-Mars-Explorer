# DEVELOPMENT_ROADMAP

Phase gates with acceptance criteria. Current phase lives in `PROJECT_STATUS.md`.

## PHASE 0 — Inspection, references, documentation ✅
- Inspect environment; study Sol Atlas + Mars Trek; verify endpoints; create the docs system;
  record decisions. *(done 2026-11-14)*

## PHASE 1 — Professional application foundation
Deliverables: scaffold, design system, navigation, routing, dashboard, Atlas (POIs), Data
Sources registry, Trek provider, tests.
- [x] Scaffold + tooling
- [x] Design system + UI primitives
- [x] App shell + responsive nav
- [x] Routes for all modules (lazy)
- [x] Dashboard (A1–A7)
- [x] Atlas (D1–D5 data foundation)
- [x] Data Sources (H1–H4 registry foundation)
- [x] **Verification pass: typecheck + lint + test + build + browser walkthrough** *(2026-11-14)*

## PHASE 2 — 3D Mars experience (Module B) ✅
- [x] R3F globe with Trek textures (MOLA color hillshade base; Viking color option; HRSC blend option)
- [x] Lighting + atmosphere rim shader (static sun; a true day/night cycle deferred — noted)
- [x] Orbit/zoom/touch controls; smooth transitions (damped OrbitControls + camera fly-to)
- [x] Lat/lon grid + POI markers (from catalog); marker → Atlas detail (rail + direct click)
- [x] Quality tiers (high/med/low) + adaptive resolution (auto-downgrade); resource disposal
- [x] WebGL-failure fallback; texture-load fallback (bounded tile retry + honest degradation)
- **DoD met:** 60 fps desktop measured at all tiers (medium default; 4096×2048 high tier);
  zero console errors in a full browser walkthrough; three.js fully code-split (`vendor-three`
  lazy chunk); textures composed only from verified WMTS layers. Mobile 30+ fps to be confirmed
  on device in Phase 6 (auto-downgrade + low tier are the mitigation). *(done 2026-11-14)*

## PHASE 3 — Scientific surface exploration (Module C)
- [ ] Region config for Jezero; regional Trek tiles via per-layer GetCapabilities
- [ ] DEM pipeline (Node `geotiff.js`+`sharp`) → heightmap PNG + slope grid + metadata JSON
- [ ] 2D explorer (pan/zoom, coordinate readout) + 3D terrain view (GPU displacement)
- [ ] Layer manager with per-layer source/resolution/attribution
- [ ] MMGIS rover-track layer (snapshot, dated)
- **DoD:** elevation readout at cursor matches published values within tolerance; all layers
  toggleable with attribution visible; no fabricated elevation.

## PHASE 4 — Terrain analysis & routing (Modules E + F)
- [ ] Slope/difficulty grids + hazard overlay (documented thresholds)
- [ ] Point inspector (elevation, slope, class, uncertainty)
- [ ] A* engine (pure TS) + cost function per ROUTE_PLANNING.md
- [ ] Route UI: endpoints, stops, alternative, straight-line compare, profile (Recharts),
      explanation panel
- **DoD:** optimality/admissibility unit tests pass; <100 ms route on target grid; honest
  labeling everywhere.

## PHASE 5 — Marswalk simulation (Module G)
- [ ] Mission config (zod) + assumptions panel; Mars24 clock; oxygen model (Pandolf-derived)
- [ ] Verdict READY/CAUTION/NO-GO + margin; return feasibility; point-of-no-return visual
- [ ] Radiation/context panel (RAD constant, cited)
- **DoD:** model outputs reproduce reference-paper examples within stated tolerance;
  every constant editable and displayed with source; disclaimer always visible.

## PHASE 6 — Polish & presentation
- [ ] Performance pass (bundle budget, image sizes, memo audit)
- [ ] Accessibility audit (keyboard nav, contrast, reduced motion)
- [ ] Playwright smoke (desktop + mobile viewport)
- [ ] Demo scenario script; final docs sync; production deploy
- **DoD:** zero known critical bugs in KNOWN_ISSUES; E2E green; docs reflect reality.
