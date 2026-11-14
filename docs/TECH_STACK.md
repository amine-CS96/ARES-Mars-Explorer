# TECH_STACK

Chosen stack, versions and the reasoning. Deviations require a note in `DECISIONS.md`.

## Core

| Tool | Version (min) | Role |
| --- | --- | --- |
| React | 19 | UI framework |
| Vite | 7 | Dev server + build (fast, ESM-native) |
| TypeScript | 5.9 strict | Type safety across all modules |
| Tailwind CSS | 4.x via `@tailwindcss/vite` | Utility styling, CSS-first `@theme` tokens |
| Radix UI | dialog / slot / tooltip (more as needed) | Accessible primitives |
| class-variance-authority | 0.7 | Component variant typing (shadcn-style) |
| lucide-react | latest | Icon system |
| react-router-dom | 7 | Routing, lazy pages |
| Zustand | 5 | Lightweight global UI/session state |
| TanStack Query | 5 | Async data fetching, caching, retries |
| Zod | 4 | Schema validation at data boundaries |
| Vitest + @testing-library/react + jsdom | latest | Unit + component tests |
| ESLint 9 (flat) + typescript-eslint + react-hooks | latest | Lint |
| Prettier 3 | latest | Format |

## Phase-gated additions

| Phase | Adds |
| --- | --- |
| 2 | `three`, `@react-three/fiber`, `@react-three/drei` (lazy-loaded; never in initial bundle) |
| 3 | Node data pipeline: `geotiff.js` + `sharp` (dev-time asset generation, not runtime deps) |
| 4 | `recharts` (elevation profiles, mission charts) |
| 6 | `@playwright/test` (E2E smoke of critical flows) |

## Decisions in one line each (details in DECISIONS.md)

- **No backend** for MVP: static curated data + public NASA tile services; add a serverless
  function only when a key must be hidden (D-003).
- **Tailwind v4 CSS-first**: tokens live in `globals.css` `@theme`; no tailwind.config.js.
- **Hand-written shadcn-style primitives**: full control, no CLI lock-in (D-005).
- **Node instead of Python** for the DEM→heightmap pipeline: this machine has no Python;
  `geotiff.js` handles PDS GeoTIFFs and `sharp` encodes PNG/WebP (D-008).
- **Vitest over Jest**: native ESM, Vite-shared config/transforms (D-007).

## Environment constraints observed

- Windows: PowerShell execution policy blocks `npm.ps1` → call `npm.cmd` in shells.
- Node 24.20 / npm 11.19 available; git available.
- Outbound network works for NASA domains (verified per-endpoint, see DATA_SOURCES.md).
