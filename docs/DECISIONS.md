# DECISIONS

Architecture/decision log. New decisions append; changes update the entry with date.

## D-001 — Manual scaffold instead of `create-vite` (2026-11-14)
`npm create vite` is interactive here and would still need cleanup; writing the 12 config files
by hand is deterministic, reviewable, and identical to the template output plus our strictness
flags. **Consequence:** full ownership of tsconfig (project references, strict flags).

## D-002 — Tailwind CSS v4, CSS-first tokens (2026-11-14)
No `tailwind.config.js`; design tokens live in `styles/globals.css` `@theme`. Aligns with
Tailwind's current direction; keeps one source of truth for the design system. Consequence:
components reference tokens as utilities (`bg-space`, `text-cyan`).

## D-003 — No backend for the MVP (2026-11-14)
Static curated data + public NASA tile services cover Phases 1–4. A serverless function is
added only if a keyed API must be hidden (e.g. DONKI) or CORS blocks verified tiles.
Consequence: cheapest hosting (static), zero ops, transparent data flow.

## D-004 — Dark-only UI (2026-11-14)
The product is a night-time mission-control instrument; a light theme doubles QA cost and
dilutes the identity. `color-scheme: dark` set globally; no theme toggle.

## D-005 — Hand-written shadcn-style primitives (2026-11-14)
shadcn/ui's value is copyable code, which we author directly (cva + Radix) to match our tokens
exactly and avoid CLI config drift. Consequence: `components/ui/*` is ours to maintain.

## D-006 — Verified-data-only policy (2026-11-14)
No endpoint, layer ID, coordinate or measurement enters `src/data/` without an HTTP check or a
published citation; unverified items are `pending-verification` and surface as such.
Consequence: the data catalog is smaller but unimpeachable; grows per phase.

## D-007 — Vitest (not Jest) (2026-11-14)
Native ESM + shared Vite transforms; zero dual-config. RTL for components; Playwright deferred
to Phase 6 for E2E (not needed to validate Phase 1 flows).

## D-008 — Node data pipeline instead of Python (2026-11-14)
This environment has no Python (verified). The DEM→heightmap pipeline will use `geotiff.js`
(reads PDS GeoTIFFs) + `sharp` (PNG encode), run as a dev-time script producing committed
artifacts under `public/data/`. Same outputs as the reference project's Python pipeline.

## D-009 — Region-first expansion (2026-11-14)
Deep, high-quality support for one region (Jezero) beats shallow coverage of many; the region
config pattern (`RegionConfig` → data paths → layers → POIs) makes additional regions a data
task, not a code task. Consequence: globe covers the planet, explorer is region-scoped.

## D-010 — Longitude convention: east-positive ±180 with per-entry conversion notes (2026-11-14)
Gazetteer/Trek sources use 0–360°E; UI displays ±180 with E/W. Conversions happen once in
`data/` with comments, so downstream code and tests see one convention.
