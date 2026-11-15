# DEMO_SCRIPT

A judge-ready walkthrough of ARES — Mars Mission Explorer. Every number below is produced by
the running app from real data; nothing is staged. Total time: ~10 minutes.

**Setup:** `npm.cmd run dev` → open `http://localhost:5173` (desktop viewport ≥ 1280 px; a
mobile pass at ≤ 912 px is step 9). Internet required: Mars Trek WMTS tiles are fetched live.

---

## 1. Mission Control (dashboard) — 60 s

- Hero strip: live MOLA global hillshade mosaic tiles (463 m/px) — watch the network tab: real
  WMTS requests to `trek.nasa.gov`, CORS-verified.
- Module grid: eight modules, honest status per phase.
- Planetary stats: NASA NSSDCA fact-sheet values, cited.
- Featured science sites: zod-verified POI catalog with measured/approximate accuracy badges.

## 2. 3D Mars globe (`/globe`) — 90 s

- Drag to rotate, scroll/pinch to zoom. The texture is a live composite of verified Trek layers
  (MOLA color hillshade default; switch to Viking MDIM 2.1 color mosaic).
- Lat/lon graticule + POI markers. Click a marker → detail dialog → jump into the Atlas entry.
- Quality tiers (high/med/low) and auto-downgrade on WebGL pressure.

## 3. Jezero surface explorer (`/explorer`) — 90 s

- Regional HiRISE (25 cm/px) and CTX (6 m/px) slippy maps inside the verified bounding box;
  toggle layers, each with its own resolution/attribution line.
- Cursor readout: coordinates + elevation (MOLA areoid) + slope class — all from the committed
  USGS CTX 20 m DEM pipeline, labeled `measured`/`derived`.
- Switch to 3D: the displaced terrain view with slope-class coloring; vertical exaggeration is
  labeled as an exaggeration, never presented as true relief.
- Perseverance rover track: dated MMGIS waypoint snapshot, honestly labeled a snapshot.

## 4. Atlas (`/atlas`) — 45 s

- Search "Olympus" → 1 result with decimal + DMS coordinates, copy button, per-entry sources.
- Category filter (Geology → count updates). Every record shows its coordinate-accuracy badge.

## 5. Hazard analysis (`/hazards`) — 90 s

- The slope-class overlay is derived from the same USGS DEM: green < 5°, amber 5–15°,
  orange 15–25°, red > 25°. Toggle it over the live CTX tile layer.
- Hover anywhere: the inspector reports elevation + slope + difficulty class with source badges.
- Read the legend footnote aloud: *"20 m/px resolves regional slopes, not individual rocks."*

## 6. Route planner (`/planner`) — 2.5 min — the centerpiece

- Click twice on the map (start green, destination orange). A* runs over the 20 m DEM cost grid
  in < 100 ms.
- Show the stats: distance, estimated metabolic energy (kJ), max/average slope, terrain
  breakdown along the route.
- The cyan route is the recommended path; the dashed gray line is the straight-line comparison;
  the amber line is the alternative (corridor-penalized re-run). The "Why this route?" panel
  quantifies the trade-off (e.g. +12% distance, −9% energy).
- Open the elevation profile: elevation vs. distance with the slope series overlaid.
- Change the max-slope slider → the route recomputes (demonstrate 10° → 15°: a shorter but
  steeper route may appear; the explanation panel updates its reasoning).
- Open "Cost-model assumptions": body mass, load, speed, suit penalty, terrain factor — all
  editable, all labeled as assumptions or cited constants (Pandolf 1977; Mars gravity 3.71 m/s²).

## 7. Marswalk simulator (`/simulator`) — 2.5 min — the payoff

- In the planner, click **"Send to Marswalk simulator"** → the real route distance/gain/slope
  arrives in the simulator config (localStorage hand-off, labeled on screen).
- The Mars24 clock ticks: local true solar time at Jezero, MSD, Lₛ, season, sun elevation —
  implemented from the NASA GISS algorithm and validated against both GISS worked examples
  (unit tests).
- The oxygen budget: Pandolf-derived energy → 20.1 kJ/L O₂ → gas mass; tank, reserve
  (default 25%), available, remaining, margin — all recomputed live as you edit any field.
- Point of no return: the outbound fraction where the reserve + a 1.2× walk-back no longer
  closes. Drag the tank size down to 0.3 kg → verdict flips READY → CAUTION → NO-GO, and the
  point-of-no-return limit drops to 0.
- Radiation context: MSL RAD surface dose (0.64 mSv/sol, Hassler et al. 2014) for the EVA
  duration vs. the 600 mSv career limit — context only.
- Assumptions panel: every constant with its source. The footer disclaimer: *"not an operational
  astronaut-safety system."*

## 8. Data sources (`/data-sources`) — 45 s

- 14+ dataset entries with kind badges (live/static/snapshot/derived/simulated/portal),
  verification status, and per-entry credits. Show one PENDING-CHECK entry as proof ARES never
  invents sources.

## 9. Mobile pass (viewport ≤ 912 px) — 60 s

- Hamburger → drawer nav (Radix dialog, ESC closes, focus is trapped).
- Explorer/Planner/Simulator layouts stack; no horizontal overflow; map remains interactive.
- Reduced-motion: with OS "reduce motion" on, animations collapse to instant.

## Talking points (science honesty)

- Every coordinate, dataset, endpoint and constant carries a source or an explicit
  assumption label; simulated/derived data is always badged.
- Route and simulator outputs are **planning estimates**, never certified life-support or
  traversability verdicts — the UI says so at every results surface.
- Real data only: USGS CTX 20 m DTM (PDS/ODE), NASA Trek WMTS, MMGIS waypoints, NSSDCA facts,
  GISS Mars24, MSL RAD. Missing tiles render dark with an honest count — never substituted.
