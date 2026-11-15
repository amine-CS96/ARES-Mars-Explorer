# SCIENTIFIC_MODELS

Every scientific/engineering model ARES uses, with its basis, formulas and assumptions. Anything
marked **PLANNED** is designed but not yet implemented — it ships only with its assumptions
panel and explicit disclaimers. Anything marked **REFERENCE** is a fixed published constant.

## 1. Planetary constants — REFERENCE (implemented Phase 1)

Source: NASA NSSDCA Mars Fact Sheet (https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html).
Values used in `src/data/planetaryFacts.ts` include: mean radius 3,389.5 km; equatorial radius
3,396.2 km; surface gravity 3.71 m/s²; axial tilt 25.19°; sidereal rotation 24.6229 h; mean
orbital distance 227.92 Gm; surface pressure ~6.36 mbar (variable); CO₂ 95.32%.

## 2. Geographic math — REFERENCE (implemented Phase 1)

- **Coordinates:** lat/lon in degrees; longitude east-positive in [−180, 180] (converted from
  0–360°E sources; conversion noted per-entry). Formatted via `utils/geo.ts`.
- **Great-circle distance** (haversine) on a sphere with Mars mean radius R = 3,389.5 km:
  `d = 2R · asin( √( sin²(Δφ/2) + cos φ₁ · cos φ₂ · sin²(Δλ/2) ) )`
- Sanity check: Octavia E. Butler Landing → Three Forks ≈ 4.6 km (matches the independently
  published reference-project figure of 4.61 km for its landing-zone leg) — covered by a unit
  test.

## 3. Mars timekeeping — IMPLEMENTED (Phase 5)

NASA GISS **Mars24** algorithm (Allison & McEwen, 2000; verified page ✅ 200), implemented
directly from https://www.giss.nasa.gov/tools/mars24/help/algorithm.html: JD(TT) → days since
J2000 → Mars parameters (M, α_FMS, PBS perturbation series, equation of center) → Lₛ →
equation of time → MSD/LMST/LTST at site longitude, plus subsolar longitude, solar declination
and solar elevation for the site.

- Validated against **both Mars24 worked examples** in unit tests
  (`src/engines/simulation/marsTime.test.ts`): the near-coincident 2000-01-06 epoch case and the
  MER-A Spirit landing case (2004-01-03T13:46:31Z, 184.702°W) — LTST, Ls, EOT, MSD and solar
  declination match the published values within the stated precision.
- Longitude convention: the algorithm uses planetographic degrees **west**; ARES east-positive
  longitudes are negated before use (`lonWest = −lonEast`).
- The mission clock displays local true solar time, local mean solar time, MSD, Lₛ, season and
  solar elevation for Jezero Crater (18.4446°N, 77.4509°E).

Implementation: `src/engines/simulation/marsTime.ts`, rendered in
`src/features/mission-simulator/SimulatorPage.tsx`.

## 4. Walking metabolism / oxygen budget — IMPLEMENTED (Phase 5)

Base model: **Pandolf et al. (1977)** load-carriage equation for metabolic power `M` (W):

```text
M = 1.5·W + 2.0·(W+L)·(L/W)² + η·(W+L)·(1.5·v² + 0.35·v·G)
```

`W` body mass (kg), `L` load (kg), `η` terrain factor, `v` speed (m/s), `G` grade (%).

Mars adaptation (assumptions, all user-editable and displayed in the UI):
1. Gravity scaling: vertical-work terms scaled by `g_mars/g_earth` (3.71/9.81 ≈ 0.378);
   documented as an engineering assumption.
2. Pressure-suit penalty: multiplicative factor on the movement terms (default 1.5×; documented
   as an engineering assumption derived from published EVA metabolic estimates).
3. Oxygen use: `VO₂ = M / (20.1 kJ per L O₂)` → litres of O₂ gas at standard conditions → mass
   via gas density 1.429 g/L at STP. This is a planning approximation: the conversion constant
   refers to gaseous O₂, so tank mass is the mass of O₂ content regardless of storage phase.
4. Reserve fraction default 25%; point-of-no-return = outbound fraction `f` solving
   `f·used + (1−f)·used·1.2 = available` (return path costs 1.2× outbound, editable assumption),
   with clamping: fraction 1.0 when the full route fits, 0.0 when even the departure leg cannot
   support a walk back within reserve.

**Output classes are planning estimates only.** No certified life-support claim is ever made.

Implementation: `src/engines/simulation/oxygenModel.ts` (reusing
`src/engines/pathfinding/costModel.ts`), rendered in `src/features/mission-simulator/`.

## 5. Surface radiation dose context — IMPLEMENTED (Phase 5, display only)

Surface dose rate measured by MSL **RAD** (Hassler et al., *Science* 2014): ≈ 0.64 mSv/sol
(given as published constant with citation). Model: EVA time × rate → context number vs. the
600 mSv career limit. Displayed as context, not as a safety decision; no shielding, solar
particle events or individual risk modeling.

Implementation: `src/engines/simulation/radiation.ts`.

## 5b. Mission verdict — IMPLEMENTED (Phase 5)

READY / CAUTION / NO-GO classification on the estimated O₂ margin:
- **READY**: margin ≥ +20% above the configured reserve.
- **CAUTION**: the plan still fits within the estimate but the buffer above reserve is thin.
- **NO-GO**: estimated O₂ use exceeds the supply available before the reserve.

Verdicts are planning classifications, never a certified EVA go/no-go ruling. Every constant is
editable in the UI with its source or explicit "engineering assumption" label; the disclaimer
"is not an operational astronaut-safety system" renders on every results view.

Implementation: `src/engines/simulation/verdict.ts`, `src/engines/simulation/missionConfig.ts`.

## 6. Terrain slope & difficulty — IMPLEMENTED (Phase 4)

- Slope from DEM: partial derivatives via central differences on the heightmap grid, scaled by
  meters-per-pixel; `slope° = atan( √( (dz/dx)² + (dz/dy)² ) )`.
- Difficulty classes (published thresholds): low/flat < 5°, moderate 5–15°, steep 15–25°,
  hazardous > 25°. The MOLA roughness layer is identified as an additional override factor but
  not yet integrated as a live overlay.
- Explicit limits: at 20 m/px the Jezero CTX DTM resolves regional slopes but not individual
  rocks/scarps below the DEM resolution; the hazard layer is a regional planning aid, not an
  obstacle map. This limitation is rendered in the UI.

Implementation: `src/engines/terrain/slopeClass.ts`, `src/engines/terrain/costGrid.ts`,
`src/features/hazard-analysis/HazardsPage.tsx`.

## 7. Route cost — IMPLEMENTED (Phase 4) → details in ROUTE_PLANNING.md

A* over the DEM cost grid; edge cost = metabolic energy (Pandolf-derived) rather than abstract
weights, so "the route minimizes estimated energy/oxygen". Edges steeper than the user's max
acceptable slope are pruned; hazardous cells are forbidden unless the user overrides. Heuristic:
flat-terrain straight-line energy lower bound (admissible).

Implementation: `src/engines/pathfinding/astar.ts`, `src/engines/pathfinding/costModel.ts`,
`src/features/route-planner/`.

## 8. Honesty rules (binding)

1. Every formula above ships with an assumptions panel in the UI.
2. Measured vs. derived vs. estimated vs. simulated is always distinguishable (badges).
3. No scientific value is displayed without its source or its "estimate" label.
4. Fiction/fictional sites are flagged `illustrative` (e.g. Ares 3 from *The Martian*).
