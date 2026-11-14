# REQUIREMENTS

Functional and non-functional requirements, mapped to the eight modules (A–H) from the master
brief. Each requirement has an ID for traceability in testing and in `PROJECT_STATUS.md`.

## Module A — Mission Dashboard

- **A1.** Landing view with hero, mission overview and tagline.
- **A2.** Real planetary statistics with source citation (NSSDCA fact sheet values).
- **A3.** Featured exploration locations (from the POI catalog, not hardcoded).
- **A4.** Quick access to every module with phase/status chips.
- **A5.** Data-source status strip linking to Module H.
- **A6.** Program/roadmap status section reflecting actual development state.
- **A7.** A real-data visual (MOLA global mosaic strip via verified Trek tiles) with graceful
  fallback when tiles cannot load.

## Module B — Interactive Mars Globe (Phase 2)

- **B1.** Three.js globe textured with real Mars imagery (Trek WMTS), realistic lighting.
- **B2.** Rotation, mouse/touch interaction, zoom, smooth camera movement.
- **B3.** Atmospheric rim shader; day/night appearance where practical.
- **B4.** Lat/lon grid toggle; clickable POI markers.
- **B5.** Smooth transition from global view to regional exploration.
- **B6.** Adaptive quality tiers + adaptive resolution; disposed GPU resources.
- **B7.** Graceful fallback when WebGL is unavailable or texture loading fails.

## Module C — Martian Surface Explorer (Phase 3)

- **C1.** Jezero Crater region as the first explorable area, reusable region config.
- **C2.** 2D surface exploration with pan/zoom and coordinate inspection.
- **C3.** 3D terrain visualization from real DEM data (heightmap pipeline).
- **C4.** Layer manager: visible imagery, elevation, hillshade, slope/difficulty, science POIs,
  rover track (MMGIS waypoints) — each layer labeled with source + resolution.
- **C5.** Terrain information panels at selected points (elevation, slope, local context).
- **C6.** Attribution visible whenever a layer is displayed.

## Module D — Scientific Points of Interest

- **D1.** Searchable catalog with name, coordinates, description, science, missions, sources.
- **D2.** Accuracy labels: `verified` / `approximate` / `illustrative` (fiction flagged).
- **D3.** Detail view with references and copyable coordinates.
- **D4.** Filtering by category and region; featured locations on the dashboard (A3).
- **D5.** No invented coordinates: every entry cites a source (MMGIS, PDS, Gazetteer, NASA).

## Module E — Terrain Hazard Analysis (Phase 4)

- **E1.** Slope from real DEM data (derived, documented method).
- **E2.** Difficulty classes (low / moderate / high / dangerous) from explicit, documented
  thresholds; uncertainty communicated.
- **E3.** Hazard overlay layer in the explorer; point inspection panel.
- **E4.** Known limits stated (low-res data cannot detect every rock/cliff).

## Module F — Intelligent Route Planner (Phase 4)

- **F1.** Start/destination selection + intermediate science stops.
- **F2.** A* over a terrain-cost grid; documented cost function (distance + slope + difficulty
  + user safety preferences); slope-limited edges.
- **F3.** Outputs: recommended route, alternative, straight-line comparison, distance,
  duration estimate, elevation profile, max slope, hazard count, decision explanation.
- **F4.** Routes on fabricated terrain must be labeled "simulated".
- **F5.** Interactive map with draggable endpoints where feasible.

## Module G — Marswalk Mission Simulator (Phase 5)

- **G1.** Inputs: astronaut mass, equipment mass, oxygen available + reserve, walking speed,
  duration, science-stop duration, max acceptable slope.
- **G2.** Outputs: distance, duration, oxygen consumption, remaining oxygen, return
  feasibility, safety margin.
- **G3.** Verdict: READY / CAUTION / NO-GO with explanation.
- **G4.** Every parameter editable; assumptions panel documents the model (Pandolf-derived
  metabolic cost, Mars24 timekeeping, RAD dose context).
- **G5.** Explicit disclaimer: planning estimate, not an operational safety system.

## Module H — Data Sources & Transparency

- **H1.** Registry: dataset name, provider, mission, instrument, resolution, coverage, update
  kind (live / static / processed / simulated / portal), last-known update, source link,
  status (available / pending-verification / planned).
- **H2.** Credits page/section for NASA, JPL, USGS, ESA/DLR/FU Berlin, ASU, MSSS, UArizona, GISS.
- **H3.** Every data surface in the app links back to this registry.
- **H4.** No endpoint or dataset metadata is invented; unverified entries are marked.

## Non-functional

- **N1.** Performance: interactive at 60 fps target on ordinary laptops; heavy assets lazy;
  initial JS bundle small (Three.js code-split).
- **N2.** Responsive: desktop, tablet, mobile (nav drawer, stacked layouts).
- **N3.** Accessibility: semantic HTML, focus management (Radix), visible focus rings,
  WCAG-AA contrast on dark background.
- **N4.** Robustness: loading/error/empty states everywhere; retry + caching via TanStack
  Query; WebGL failure fallback.
- **N5.** Maintainability: strict TS, documented models, layering rules (see ARCHITECTURE).
- **N6.** Offline-ish resilience: UI must remain navigable if external tiles fail.
