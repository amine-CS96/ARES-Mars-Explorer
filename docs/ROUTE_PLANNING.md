# ROUTE_PLANNING

Design for Module F (Phase 4). **Implemented.** Routes run on the real Jezero CTX 20 m DEM;
any future demo on synthetic terrain will be labeled `SIMULATED — synthetic terrain`.

## 1. Data substrate

- **Grid:** DEM heightmap (meters), meters-per-pixel known → each cell carries elevation,
  slope (from gradient), difficulty class (SCIENTIFIC_MODELS §6).
- **Region:** Jezero first (Mars 2020 CTX DTM ~20 m/px via PDS/ODE, processed by our Node
  pipeline). Resolution and coverage always displayed with the route.
- **Fallback:** none silently. Without a DEM, routing is disabled with an honest status.

Implementation: `src/engines/terrain/costGrid.ts` builds a downsampled cost grid (default
256 × 256, configurable 128–384) with slope recomputed by central differences.

## 2. Cost function (documented, not arbitrary)

Edge cost between cells a→b = **metabolic energy** (J), integrating Pandolf-derived power over
the step, adapted to Mars gravity + suit penalty (SCIENTIFIC_MODELS §4). Rationale: minimizing
energy ≈ minimizing oxygen, which is the survival-relevant quantity; no invented weight knobs.

- **Constraints:** `slope(edge) ≤ maxSlope(user)`, else edge forbidden; cells of difficulty
  `hazardous` forbidden unless user overrides (then flagged).
- **User preferences:** max slope, routing-grid resolution, allow-dangerous override, and
  editable cost-model parameters (body mass, load, speed, suit penalty, terrain factor).
  Science-stop dwell times are cost-neutral to routing and deferred to the Phase 5 simulator.
- **Heuristic (admissible):** flat-terrain straight-line energy lower bound ≤ true cost → A*
  stays optimal.

Implementation: `src/engines/pathfinding/costModel.ts`.

## 3. Algorithm

- A* with binary heap over 8-connected grid (diagonal moves scaled by √2 and corner-cut
  prevention). No post-smoothing is applied; the grid resolution is chosen to keep the
  polyline legible.
- Performance: routes on the 256 × 256 Jezero grid complete in well under 100 ms on a laptop.

Implementation: `src/engines/pathfinding/astar.ts`.

## 4. Outputs (UI contract)

1. Recommended route polyline on the map; 2) alternative route (primary corridor penalized by
   raising elevation near the primary path and re-running A*); 3) straight-line comparison;
   4) total distance; 5) estimated energy; 6) elevation profile (Recharts) with slope series;
   7) max/average slope + hazard-count breakdown; 8) plain-language explanation referencing
   distance and energy trade-offs.

Implementation: `src/features/route-planner/`.

## 5. Comparison & explanation rules

- Always show straight-line vs. routed distance (fairness: users judge the trade-off).
- Every route decision references the cost model, not "looks better".
- If the route is on simulated terrain (demo mode), banner: `SIMULATED — synthetic terrain`.

## 6. Testing strategy

- Unit: cost function on synthetic grids (flat ridge vs. steep ridge — expect detour);
  admissibility of heuristic (≤ true cost on sampled pairs); optimality on small grids vs.
  brute-force Dijkstra; forbidden-edge pruning.
  **Status:** `src/engines/pathfinding/astar.test.ts` and `costModel.test.ts` cover these.
- Property: route endpoints match inputs; path cells all within slope constraint.
- E2E (Phase 6): plan a fixed route on the shipped DEM; assert distance within tolerance.
