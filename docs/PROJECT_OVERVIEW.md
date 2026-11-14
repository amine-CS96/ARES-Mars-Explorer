# PROJECT_OVERVIEW

**ARES — Mars Mission Explorer** · *Explore Mars. Plan Smarter. Survive Further.*
NASA Space Apps Challenge 2026 — *Interplanetary Survival Guide: Martian Map*

## 1. The problem

Mars is hostile and poorly understood at human scale. Anyone planning surface activity needs to
know: where is safe ground, where are the hazards, where are the scientifically valuable places,
how far apart are they, and whether a suited astronaut can actually reach them and come back.
Public data exists (MOLA, THEMIS, CTX, HiRISE, HRSC, mission feeds), but it is spread across
different portals, formats and resolutions. ARES unifies the pieces that matter for exploration
planning in one immersive, transparent interface.

## 2. The solution

ARES is a mission-control-style web application that lets users:

1. **Explore Mars** — a real-texture interactive 3D globe and a regional 2D/3D surface
   explorer (Jezero Crater first) with toggleable scientific layers.
2. **Understand terrain** — elevation, slope and difficulty classification built on published
   datasets with explicit criteria and uncertainty statements.
3. **Discover science sites** — a searchable, source-cited atlas of points of interest
   (verified, approximate and illustrative entries clearly distinguished).
4. **Plan routes** — A* pathfinding over a terrain-cost grid that considers distance, slope,
   difficulty and user safety preferences; routes compared against the straight line.
5. **Simulate a Marswalk** — oxygen budget, duration, return feasibility and a
   READY / CAUTION / NO-GO verdict from a documented, editable model.
6. **Stay honest** — a Data Sources module exposing provider, mission, instrument, resolution,
   coverage, update kind (live / static / processed / simulated) and credits for every layer.

## 3. Users

- Space Apps judges and mentors evaluating scientific rigor and UX.
- Students and space enthusiasts exploring Mars.
- Educators demonstrating mission planning trade-offs.
- Mission-idea teams prototyping surface operations concepts.

## 4. Design principles

1. **Scientific credibility over spectacle.** Every number is traceable; unknowns are labeled.
2. **Mission-control aesthetics, everyday usability.** Premium dark UI, mono telemetry, but
   plain-language explanations and generous empty/loading states.
3. **Progressive disclosure.** Globe → region → zone: each level adds detail.
4. **Graceful degradation.** Slow networks and WebGL failures get clean fallbacks, not errors.
5. **Transparency.** Simulated data is labeled simulated; estimates are labeled estimates.

## 5. Scope for the challenge

- MVP region: **Jezero Crater** (Perseverance landing site) with the wider planet on the globe.
- Later regions follow the same reusable architecture (Gale, Olympus Mons, Valles Marineris…).
- No backend in the MVP: static catalog data + public tile services + client-side engines.
  A serverless function is acceptable later for key-holding (e.g. NASA APIs) — see D-003.

## 6. What is real vs. simulated

| Kind | Examples | Label shown to users |
| --- | --- | --- |
| Real static data | MOLA/Viking/THEMIS/HRSC tiles, MMGIS waypoints | provider + instrument + resolution |
| Derived data | slope grids, hillshades, route costs | "derived from X" + criteria |
| Estimates | route duration, oxygen use | "estimate — model assumptions listed" |
| Simulated | fallback demo terrain if DEM missing | clearly "SIMULATED" |
| Fiction | Ares 3 site (The Martian) | "illustrative / fiction" |
