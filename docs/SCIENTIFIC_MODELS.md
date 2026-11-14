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

## 3. Mars timekeeping — PLANNED (Phase 5)

NASA GISS **Mars24** algorithm (Allison & McEwen, 2000; verified page ✅ 200):
solar longitude Ls → Mars Solar Date → Local Mean/True Solar Time at site longitude.
Outputs needed: Mars sol date, local true solar time at Jezero (for sun position/shadows and the
mission clock), season label. Implementation will be unit-tested against the Mars24 reference
examples. Earth–Mars signal delay computed from approximate Keplerian elements (JPL).

## 4. Walking metabolism / oxygen budget — PLANNED (Phase 5)

Base model: **Pandolf et al. (1977)** load-carriage equation for metabolic power `M` (W):

```text
M = 1.5·W + 2.0·(W+L)·(L/W)² + η·(W+L)·(1.5·v² + 0.35·v·G)
```

`W` body mass (kg), `L` load (kg), `η` terrain factor, `v` speed (m/s), `G` grade (%).

Planned Mars adaptation (assumptions, all user-editable and displayed):
1. Gravity scaling: vertical-work terms scaled by `g_mars/g_earth` (0.379); the reference
   project validated the resulting flat-walk power (~293 W at 0.9 m/s) against published suit
   EVA metabolic rates; we will restate and cite our assumption rather than their number.
2. Pressure-suit penalty: multiplicative factor on the movement terms (default derived from
   published Apollo/SSP EVA metabolic estimates; documented as an engineering assumption).
3. Oxygen use: `V̇O₂ = M / (20.1 kJ per L O₂)` → L O₂/h → kg O₂/h (density of liquid/gaseous
   O₂ accounting documented; default tank sized so a flat 8 h EVA fits with margin).
4. Reserve fraction default 25%; point-of-no-return = first route point where
   (oxygen used so far + straight-walk-back cost × detour factor) would breach the reserve.

**Output classes are planning estimates only.** No certified life-support claim is ever made.

## 5. Surface radiation dose context — PLANNED (Phase 5, display only)

Surface dose rate measured by MSL **RAD** (Hassler et al., *Science* 2014): ≈ 0.64 mSv/day
(given as published constant with citation). Model: EVA time × rate → context number vs. the
600 mSv career limit. Displayed as context, not as a safety decision.

## 6. Terrain slope & difficulty — PLANNED (Phase 4)

- Slope from DEM: partial derivatives via central differences on the heightmap grid, scaled by
  meters-per-pixel; `slope° = atan( √( (dz/dx)² + (dz/dy)² ) )`.
- Difficulty classes (initial thresholds, to be calibrated and published in-app):
  low < 5°, moderate 5–15°, high 15–25°, dangerous > 25° (plus roughness override when the
  MOLA roughness layer is available).
- Explicit limits: at ≥ 463 m/px, rocks < ~50 m cannot be individually detected; the hazard
  layer is a regional planning aid, not an obstacle map.

## 7. Route cost — PLANNED (Phase 4) → details in ROUTE_PLANNING.md

A* over the DEM grid; edge cost = metabolic energy (Pandolf-derived) rather than abstract
weights, so "the route minimizes oxygen", with edges steeper than the user's max acceptable
slope pruned. Heuristic: straight-line energy lower bound on flat terrain (admissible).

## 8. Honesty rules (binding)

1. Every formula above ships with an assumptions panel in the UI.
2. Measured vs. derived vs. estimated vs. simulated is always distinguishable (badges).
3. No scientific value is displayed without its source or its "estimate" label.
4. Fiction/fictional sites are flagged `illustrative` (e.g. Ares 3 from *The Martian*).
