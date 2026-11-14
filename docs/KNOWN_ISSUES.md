# KNOWN_ISSUES

Live list. Anything not fixed is visible here; nothing is hidden.

| # | Issue | Impact | Status | Workaround / plan |
| --- | --- | --- | --- | --- |
| K-1 | PowerShell execution policy blocks `npm.ps1` | dev friction | open | Use `npm.cmd` in shells; documented in AGENTS.md |
| K-2 | Python not installed on this machine | DEM pipeline (Phase 3) | **resolved** | Node pipeline (`geotiff.js` + `sharp`) implemented and verified in `scripts/build-jezero-terrain.mjs` (D-008) |
| K-3 | Regional Trek layers (Jezero HiRISE 25 cm, CTX 6 m) 404 at global zoom 0 | Phase 3 tile access | **resolved** | GetCapabilities parsed; both use `default028mm`; HiRISE zooms 14–17, CTX zooms 8–13; live tile requests verified 200 inside bbox |
| K-4 | `mars.nasa.gov/mars2020/` returns 302 (redirect target unpinned) | citation quality | open | Keep as citation (redirects resolve in browser); optionally pin final URL |
| K-5 | `science.nasa.gov/mars/`, `hirise.lpl.arizona.edu` unreachable from this env (000) | verification | open | Not used as data sources; not cited until reachable |
| K-6 | Trek tile CORS for WebGL textures unverified | Phase 2 | **resolved** | Verified 2026-11-14: tiles return `Access-Control-Allow-Origin: *` — client-side WebGL textures and canvas composites work without a server (D-011) |
| K-7 | npm transient `ECONNRESET` during install | setup friction | intermittent | Retry `npm.cmd install` (succeeded on retry 2026-11-14) |
| K-8 | esbuild postinstall not executed under allowScripts policy | ~~potential build issue~~ | **resolved** | `vite build` succeeded (exit 0) — esbuild binary works; no action needed |
| K-9 | PowerShell renders npm's stderr banner (`> vite …`) as error records; exit status unreadable | dev friction | open | Run scripts via `cmd /c "npm run <script>"` to get true exit codes; `npm.cmd` for direct calls |
| K-10 | Trek occasionally slow: individual tile requests can hit `net::ERR_TIMED_OUT` (seen live: 2 of 128 high-tier tiles, 2026-11-14) | globe texture completeness | mitigated | `composeMosaic` runs one bounded retry pass; persistent failures surface as dark patches with an honest count — never substituted |

Resolved recently: K-8 (esbuild works — build passing, 2026-11-14) · K-6 (Trek CORS open, 2026-11-14) · K-2 (Node DEM pipeline, 2026-11-14) · K-3 (regional tile matrix sets, 2026-11-14)
