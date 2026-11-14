# CHANGELOG

All significant changes to ARES. Format: date — phase — summary.

## 2026-11-14 — Phase 0 + 1 — Project birth

### Phase 0 — Inspection & documentation system
- Inspected environment (Node 24, npm 11.19, Windows; Python unavailable).
- Studied references: **Sol Atlas** repo (architecture, data pipeline, science models,
  verified coordinates) and **NASA Mars Trek** WMTS API (tile template, layer catalog).
- Verified live endpoints with HTTP checks; catalogued 146 Mars Trek layer products.
- Created the permanent documentation system (`AGENTS.md`, `README.md`, `PROJECT_STATUS.md`,
  `CHANGELOG.md`, `docs/*` ×14).
- Recorded architecture decisions D-001…D-009 in `docs/DECISIONS.md`.

### Phase 1 — Professional application foundation
- Scaffolded React 19 + Vite 7 + TypeScript (strict) project; Tailwind CSS v4 design system
  with the mandated palette (#080B12 / #111722 / #E56B3F / #53D6E8) and typography
  (Orbitron / Inter / JetBrains Mono).
- Wired ESLint (flat), Prettier, Vitest + Testing Library.
- Built app shell: responsive top navigation, mobile drawer (Radix Dialog), footer with
  attribution, error boundary, scroll restoration.
- Implemented routing for all modules with lazy loading: `/`, `/globe`, `/explorer`,
  `/atlas`, `/hazards`, `/planner`, `/simulator`, `/data-sources`, 404.
- Built UI primitives: Button, Badge, Card, Dialog, Separator, Skeleton, Tooltip,
  StatusBadges (data kind, coordinate accuracy, phase).
- Implemented **Module A — Mission Dashboard** with a real MOLA mosaic strip (Trek WMTS),
  module grid, planetary statistics (NSSDCA), featured locations, program status.
- Implemented **Module D — Points of Interest** foundation: zod-validated, source-cited
  catalog of verified/approximate/illustrative locations with search, filters and detail
  dialogs.
- Implemented **Module H — Data Sources** foundation: registry of datasets with provider,
  mission, instrument, kind (live/static/processed/external), status, credits.
- Added Mars Trek tile provider with verified layer IDs and tile-URL builder.
- Added unit/component tests (geo math incl. haversine sanity check against published
  Jezero site distances; data-integrity tests; UI smoke tests).
- **Verification pass complete**: typecheck ✓ · lint ✓ · Vitest 26/26 ✓ · `vite build`
  exit 0 (vendor chunks split; main index 264 kB / 82.7 kB gzip) ✓ · live browser
  walkthrough of dashboard, atlas (dialog/filter/search), data-sources and a placeholder
  module route, plus mobile drawer navigation — zero console errors; live MOLA tiles
  confirmed HTTP 200 in the browser network log.
