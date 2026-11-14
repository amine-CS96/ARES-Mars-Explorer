# ROUTE_PLANNING

Design for Module F (Phase 4). No route ships until it runs on a real DEM — routes over a
fabricated grid must be labeled `SIMULATED` and will be clearly marked if ever used for demos.

## 1. Data substrate

- **Grid:** DEM heightmap (meters), meters-per-pixel known → each cell carries elevation,
  slope (from gradient), difficulty class (SCIENTIFIC_MODELS §6).
- **Region:** Jezero first (Mars 2020 CTX DTM ~20 m/px via PDS/ODE, processed by our Node
  pipeline). Resolution and coverage always displayed with the route.
- **Fallback:** none silently. Without a DEM, routing is disabled with an honest status.

## 2. Cost function (documented, not arbitrary)

Edge cost between cells a→b = **metabolic energy** (J), integrating Pandolf-derived power over
the step, adapted to Mars gravity + suit penalty (SCIENTIFIC_MODELS §4). Rationale: minimizing
energy ≈ minimizing oxygen, which is the survival-relevant quantity; no invented weight knobs.

- **Constraints:** `slope(edge) ≤ maxSlope(user)`, else edge forbidden; cells of difficulty
  `dangerous` forbidden unless user overrides (then flagged).
- **User preferences:** max slope, avoidance margin, science-stop dwell times (cost-neutral to
  routing, used by the simulator).
- **Heuristic (admissible):** flat-terrain straight-line energy lower bound × conservative
  gravity factor ≤ true cost → A* stays optimal.

## 3. Algorithm

- A* with binary heap over 8-connected grid (diagonal moves scaled by √2 and corner-cut
  prevention); path smoothing optional (string-pulling on the cost grid) with re-check.
- Performance target: < 100 ms for 512×512 region on a laptop (reference implementation
  solved its default loop in < 40 ms with the same design; we must only meet our own budget).

## 4. Outputs (UI contract)

1. Recommended route polyline on map/terrain; 2) alternative route (penalized re-run, e.g.
   inflate cost near the primary corridor); 3) straight-line comparison; 4) total distance;
   5) duration estimate (speed model from slope, editable); 6) elevation profile (Recharts);
   7) max slope + hazard count along route; 8) explanation: "this route avoided a 19° section
   east of X at +N% distance but −M% energy".

## 5. Comparison & explanation rules

- Always show straight-line vs. routed distance (fairness: users judge the trade-off).
- Every route decision references the cost model, not "looks better".
- If the route is on simulated terrain (demo mode), banner: `SIMULATED — synthetic terrain`.

## 6. Testing strategy

- Unit: cost function on synthetic grids (flat ridge vs. steep ridge — expect detour);
  admissibility of heuristic (≤ true cost on sampled pairs); optimality on small grids vs.
  brute-force Dijkstra; forbidden-edge pruning.
- Property: route endpoints match inputs; path cells all within slope constraint.
- E2E (Phase 6): plan a fixed route on the shipped DEM; assert distance within tolerance.
