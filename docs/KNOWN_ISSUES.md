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
| K-11 | NASA Mars Rover Photos API (`api.nasa.gov/mars-photos/api/v1`) returns Heroku "No such app" 404 | raw-images API integration | open | Use reverse-engineered `mars.nasa.gov/rss/api` feed with explicit "unofficial endpoint" label; monitor for NASA restoring the public API |
| K-12 | Perseverance raw-images RSS feed has no per-image lat/lon | map placement of rover photos | open | Display raw images in a gallery/grid only; do not georeference thumbnails until a verified camera-geometry source is found |
| K-13 | Slope recomputation in routing grid uses central differences on a downsampled grid, while the displayed slope map uses Horn-like differences on the full-resolution DEM | minor inconsistency between hazard overlay and route-cost slope values | open | Documented in `docs/SCIENTIFIC_MODELS.md`; values are close but may diverge at cell boundaries. Future work: use one method end-to-end. |
| K-14 | Alternative route energy cost includes the artificial corridor penalty | alternative-route energy is not directly comparable to the primary route energy | open | Label the alternative as a "corridor-penalized" option; future work: recompute its energy on the original cost grid. |
| K-15 | Geologic map overlay unavailable | cannot show official geologic units on the map | open | No public WMTS/REST tile service found; keep listed as planned in `docs/DATA_SOURCES.md`. |
| K-16 | MOLA global base map renders blurry at zoom ≥ 8 in Hazards/Explorer | cosmetic: base context is upscaled | open | Pre-existing clamped-tile behavior (D-014): global layers max out at zoom 7–9; the regional CTX overlay stays sharp where tiles exist. Future work: a global mid-res layer for zooms 8–12. |
| K-17 | All 40 detected hazard clusters classify Critical under the Standard profile | presentation: severity variety in inventory/charts is limited | open | Engine-defined: cluster severity = max member severity, and every ≥50,000 m² cluster contains ≥1 critical cell. The UI presents this honestly (D-017). Future work: aggregate cluster severity by area-weighted mean, clearly labeled as a different metric. |
| K-18 | Hazards right panel covers most of the map width at 390 px viewport | mobile: map visible only as a left strip | mitigated | Panel-over-map sheet pattern; Controls drawer and tabs verified working at 390×844 via Playwright screenshots. Future work: bottom-sheet layout or hideable panel on small screens. |

Resolved recently: K-8 (esbuild works — build passing, 2026-11-14) · K-6 (Trek CORS open, 2026-11-14) · K-2 (Node DEM pipeline, 2026-11-14) · K-3 (regional tile matrix sets, 2026-11-14)
