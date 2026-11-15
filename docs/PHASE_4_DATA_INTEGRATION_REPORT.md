# Phase 4 — Data Integration Report

> Investigation of the five official NASA Space Apps challenge resources requested for the
> *Interplanetary Survival Guide: Martian Map* challenge, plus the data-layer implications for
> ARES Phase 4 (terrain analysis & route planning).
>
> Date: 2026-11-14  
> Scope: documentation only — no feature code changes were made during this work.

---

## 1. Executive summary

All five requested resources were inspected from this build environment. Only **NASA Mars Trek**
already provides live, machine-readable, CORS-open map services that ARES can consume directly.
The other four resources are either (a) human-facing portals with downloadable products but no
verified public tile/vector service, (b) Earth-only services with no Mars coverage, or
(c) image galleries whose official API is currently offline and whose data must be reached
through a reverse-engineered JSON feed.

Consequence for Phase 4:

- **Terrain analysis and routing will run on the verified Jezero CTX 20 m DEM and Trek tile
  services** already used in Phase 3. No new authoritative elevation/raster endpoint was found.
- **Perseverance raw images** can be added as a `SNAPSHOT`/`LIVE` gallery via the reverse-engineered
  `mars.nasa.gov/rss/api` feed, with a clear "unofficial endpoint" disclaimer.
- **Global geologic maps** are available as PDF/image downloads from USGS Astropedia, not as a
  live tile/REST service. A geologic-map view in ARES would require manual curation or a static
  image overlay, both clearly labeled.
- **NASA Worldview/GIBS** cannot be used for Mars imagery; the project already has the correct
  Trek-based solution (D-011).
- **Curiosity's Mount Sharp route** is an illustrative science article, not a coordinate dataset.
  It can be cited as context but not plotted programmatically.

No endpoint, layer ID, or coordinate in this report is fabricated. Every probe result carries an
HTTP status and a date.

---

## 2. Investigation methodology

For each resource we recorded:

1. **Data type** (tile service, REST API, catalog portal, static download, article).
2. **Endpoint / format / layer IDs** (probed live with `curl` and `Invoke-WebRequest`).
3. **Spatial coverage & coordinate system** (from official docs or catalog metadata).
4. **Licensing / attribution** (NASA/USGS/ESA public-use policy where applicable).
5. **Accessibility from this environment** (HTTP status, response size, CORS headers).
6. **CORS status** for browser use.
7. **Suitability** for visualization vs. analysis.

All probes were run on 2026-11-14 from `C:\Users\Amine\My_Documents\NASA_SPACE_Challenge_2026\Martian_Map`
on a Windows 11 host with direct internet access.

---

## 3. Resource-by-resource analysis

### 3.1 NASA Mars Trek — ✅ already integrated, still the best source

| Item | Finding |
| --- | --- |
| **Data type** | OGC WMTS tile service + searchable layer catalog |
| **API doc** | https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars (✅ 200) |
| **Tile template** | `https://trek.nasa.gov/tiles/Mars/EQ/{LAYER}/1.0.0/default/default028mm/{Z}/{ROW}/{COL}.{ext}` (✅ 200 on `0/0/0.jpg`) |
| **Catalog** | `https://trek.nasa.gov/mars/TrekServices/ws/index/eq/searchItems?...` (✅ 200, 146 products) |
| **Spatial coverage** | Global (equirectangular, 2:1 zoom 0 grid) + regional products (e.g. Jezero) |
| **Coordinate system** | Equirectangular (`default028mm` TileMatrixSet); regional products use `latTs=0` equirectangular with per-product bboxes |
| **Licensing** | NASA/JPL-Caltech — generally not copyrighted; attribution required |
| **CORS** | `Access-Control-Allow-Origin: *` (verified 2026-11-14) — safe for WebGL/canvas |
| **Suitability** | Primary visualization layer for 2D/3D; source of `mola_roughness` for hazard override |

**Phase 4 relevance:** Mars Trek already covers the imagery needed for Modules E/F. The
`mola_roughness` layer can serve as the additional roughness override mentioned in
`SCIENTIFIC_MODELS.md` §6. No new integration work is required for tiles.

**Catalog findings relevant to Phase 4:**

A search of the Trek catalog for "geologic" returned named feature/landing-site layers and a
`Global Geology` reference layer, plus `Hydrous Mineral Detections (OMEGA, CRISM)` and
`Aqueous Mineral Distribution`. These are *overlays*, not a publishable global geologic-map tile
service. They may be useful in a future "science overlays" feature but do not replace the
USGS Astropedia global geologic map.

---

### 3.2 USGS-NASA Planetary Geologic Mapping — ⚠️ portal + static downloads only

| Item | Finding |
| --- | --- |
| **Portal** | https://astrogeology-usgs.hub.arcgis.com/ (✅ 200) |
| **Interactive maps page** | https://astrogeology-usgs.hub.arcgis.com/pages/interactive-maps-mars (✅ 200) |
| **Global Mars geologic map** | https://astrogeology.usgs.gov/search/map/mars_geologic_map (✅ 200) |
| **Download product** | PDF: `https://astrogeology.usgs.gov/ckan/dataset/fdbdb3d3-1497-4b29-a0f6-7fae04e69554/resource/1d4106ac-9fc6-4282-8a3c-a395e79087ba/download/mars-geologic-map.pdf` (6.79 MB); full.jpg also offered |
| **Public ArcGIS REST** | **Not found.** Probed `https://astrogeology.usgs.gov/arcgis/rest/services` and variant paths — all 404. |
| **ArcGIS Hub search API** | `https://astrogeology-usgs.hub.arcgis.com/api/search/v1/collections/all/items?q=Mars` → `numberMatched: 0` |
| **Data type** | Web portal + downloadable PDF/image; no verified live map service |
| **Coordinate system** | PDF/GeoTIFF products are planetary equirectangular or projected per quadrangle |
| **Licensing** | USGS/NASA public domain; cite USGS Astrogeology Science Center |
| **CORS** | N/A for browser integration — portal pages are not CORS-open APIs |
| **Suitability** | Reference/citation only in Phase 4; direct visualization requires manual ingestion |

**Phase 4 relevance:** This resource does **not** provide a live tile/REST service we can call
from the browser. Options, in order of scientific honesty:

1. **Portal link only** (Module H data catalog) — link to the Astropedia page with status `portal`.
2. **Static image overlay** (future) — download the published full.jpg/PDF, georeference it
   against the same equirectangular grid, and serve it as a transparent overlay in the explorer.
   Label it `derived / illustrative` and clearly state the source and the map vintage (1978
   global map; later quadrangle maps exist).
3. **No implementation** — keep the geologic map as a cited reference without a live layer.

Recommendation: implement option 1 now; leave option 2 for Phase 6 if time permits.

---

### 3.3 NASA Curiosity Mount Sharp route — ⚠️ illustrative reference only

| Item | Finding |
| --- | --- |
| **Resource** | https://science.nasa.gov/resource/curiositys-proposed-path-up-mount-sharp/ (✅ 200) |
| **Data type** | Science article with an animated GIF illustration |
| **Route coordinates** | **None found.** The page shows an artist/team illustration of the planned ascent, not a downloadable track, GeoJSON, KML, or table. |
| **Licensing** | NASA Science content; attribution required |
| **CORS** | N/A |
| **Suitability** | Context/curiosity only; cannot be plotted on the map programmatically |

**Phase 4 relevance:** This page is useful for the *story* of ascent planning but cannot drive
route-planning features. If a future Phase adds Mount Sharp as a region, the route would need
to come from a different source (e.g. MSL mission planning documents, PDS-derived traverse
shapefiles, or manual curation with `illustrative` labels).

---

### 3.4 NASA Worldview / GIBS — ❌ Earth-only; not usable for Mars

| Item | Finding |
| --- | --- |
| **Portal** | https://worldview.earthdata.nasa.gov/ (✅ 200) |
| **WMTS GetCapabilities** | `https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/wmts.cgi?SERVICE=WMTS&REQUEST=GetCapabilities` (✅ 200, 5.3 MB XML) |
| **Mars layers** | **Zero.** `Select-String` for `mars/Mars/MARS` returned 0 matches in the 5.3 MB capabilities document. |
| **Data type** | Earth-observation WMTS tile service |
| **Coordinate systems** | EPSG:4326, polar stereographic, UTM — all Earth |
| **Licensing** | NASA open data |
| **CORS** | Not relevant — no Mars data |
| **Suitability** | Not suitable for ARES Mars visualization |

**Phase 4 relevance:** Confirms D-011 — the only verified global Mars tile source is NASA Mars
Trek. No Worldview integration should be attempted.

---

### 3.5 Mars Perseverance Raw Images Gallery — 🟡 official API down; alternative JSON feed works

| Item | Finding |
| --- | --- |
| **Gallery** | https://mars.nasa.gov/mars2020/multimedia/raw-images/ (✅ 200) |
| **Official API** | `https://api.nasa.gov/mars-photos/api/v1/...` (❌ 404 "No such app" — Heroku app gone) |
| **Reverse-engineered feed** | `https://mars.nasa.gov/rss/api/?feed=raw_images&category=mars2020,ingenuity&feedtype=json&ver=1.2&num={n}&page={p}&order=sol+desc&extended=sample_type::full` (✅ 200, CORS `*`) |
| **Image CDN** | `https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/{SOL}/ids/edr/browse/{CAM}/{FILENAME}_{size}.jpg` (✅ 200) |
| **Data type** | JSON feed + direct image CDN |
| **Fields observed** | `imageid`, `sol`, `camera.instrument`, `date_taken_utc`, `caption`, `image_files.{small,medium,large,full_res}`, `credit` |
| **Spatial coverage** | Jezero Crater and surrounding traverse (rover-based image locations are not in the feed; approximate location requires MMGIS waypoints or PDS data) |
| **Coordinate system** | N/A for the feed; sol/camera/instrument only |
| **Licensing** | NASA/JPL-Caltech/MSSS — raw images are generally public with credit |
| **CORS** | Feed: `Access-Control-Allow-Origin: *` (verified). Images: no CORS headers observed; safe for `<img>` but not for canvas/WebGL unless served with CORS. |
| **Suitability** | Gallery/grid of recent rover images; not a georeferenced map layer without extra work |

**How the feed was discovered:** The gallery page loads
`/js/raw-images/m20/static/js/main.1a396d7e.chunk.js`. Searching that bundle for API calls
revealed the `getData` function constructing the `/rss/api/?feed=raw_images&...` URL. The same
URL was then requested directly and returned JSON.

**Phase 4 relevance:** This feed can power a **Perseverance Raw Images panel** in the explorer
or dashboard: latest images by sol/camera, with links to full-resolution downloads. Because the
feed is not a documented public API, the UI must label it as a `derived`/`unofficial endpoint`
and degrade gracefully if NASA changes or removes it.

Recommended scope for Phase 4:

- Fetch latest N images per sol/camera from the RSS feed.
- Display thumbnails + sol/camera/date + link to full image.
- Do **not** georeference individual images on the map unless a verified camera-location source
  is found (the MMGIS waypoints give rover positions, not camera pointing/geometry).

---

## 4. Verified endpoints summary

| # | Resource | Verified URL | Status | Date |
| --- | --- | --- | --- | --- |
| 1 | Mars Trek API docs | `https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars` | ✅ 200 | 2026-11-14 |
| 2 | Mars Trek tile (global MOLA z0) | `https://trek.nasa.gov/tiles/Mars/EQ/Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0/default/default028mm/0/0/0.jpg` | ✅ 200 | 2026-11-14 |
| 3 | Mars Trek catalog | `https://trek.nasa.gov/mars/TrekServices/ws/index/eq/searchItems?start=0&rows=100&text=geologic` | ✅ 200 | 2026-11-14 |
| 4 | USGS Astrogeology Hub | `https://astrogeology-usgs.hub.arcgis.com/` | ✅ 200 | 2026-11-14 |
| 5 | USGS Mars geologic map page | `https://astrogeology.usgs.gov/search/map/mars_geologic_map` | ✅ 200 | 2026-11-14 |
| 6 | USGS geologic map PDF | `https://astrogeology.usgs.gov/ckan/dataset/fdbdb3d3-1497-4b29-a0f6-7fae04e69554/resource/1d4106ac-9fc6-4282-8a3c-a395e79087ba/download/mars-geologic-map.pdf` | ✅ 200 (link valid; astropedia download timed out in one probe) | 2026-11-14 |
| 7 | Curiosity Mount Sharp article | `https://science.nasa.gov/resource/curiositys-proposed-path-up-mount-sharp/` | ✅ 200 | 2026-11-14 |
| 8 | NASA Worldview | `https://worldview.earthdata.nasa.gov/` | ✅ 200 | 2026-11-14 |
| 9 | GIBS WMTS GetCapabilities | `https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/wmts.cgi?SERVICE=WMTS&REQUEST=GetCapabilities` | ✅ 200, 0 Mars layers | 2026-11-14 |
| 10 | Perseverance raw images gallery | `https://mars.nasa.gov/mars2020/multimedia/raw-images/` | ✅ 200 | 2026-11-14 |
| 11 | Official NASA Mars Rover Photos API | `https://api.nasa.gov/mars-photos/api/v1/rovers/perseverance/latest_photos?api_key=DEMO_KEY` | ❌ 404 "No such app" | 2026-11-14 |
| 12 | Reverse-engineered raw-images JSON | `https://mars.nasa.gov/rss/api/?feed=raw_images&category=mars2020,ingenuity&feedtype=json&ver=1.2&num=5&page=0&order=sol+desc&extended=sample_type::full` | ✅ 200 + CORS `*` | 2026-11-14 |
| 13 | Perseverance image CDN | `https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/02031/ids/edr/browse/scam/LRF_2031_0847237865_241EBY_N0930000SCAM01031_0100I4J01_320.jpg` | ✅ 200 | 2026-11-14 |

---

## 5. Limitations and mitigations

| Limitation | Impact | Mitigation |
| --- | --- | --- |
| USGS geologic maps are PDF/image, not live tiles | Cannot add a one-click geologic overlay | Keep as portal link; optional future static overlay with full provenance |
| Curiosity route has no machine-readable coordinates | Cannot plot official Mount Sharp path | Cite as context only; use illustrative label if ever manually plotted |
| GIBS/Worldview has no Mars layers | Not usable for ARES | Continue using Trek (D-011) |
| NASA Mars Rover Photos API is down | Cannot use the documented public API | Use reverse-engineered RSS feed with unofficial-endpoint disclaimer |
| Raw-images feed has no lat/lon per image | Cannot place thumbnails on map precisely | Show gallery/grid only; georeferencing deferred until verified camera geometry source found |
| Image CDN lacks CORS headers | Thumbnails can be displayed with `<img>`, not canvas/WebGL | Use `<img>` elements; no canvas/WebGL processing |
| Regional Trek layers 404 outside bbox | Must enforce per-layer zoom/bbox in code | Already enforced in Phase 3 (`RegionConfig`, `VERIFIED_REGIONAL_LAYERS`) |

---

## 6. Recommended Phase 4 architecture

Based on the investigation, Phase 4 should build on the existing substrate rather than add new
authoritative data services:

### 6.1 Data substrate (unchanged)

- **DEM:** USGS CTX 20 m Jezero DTM → committed `public/data/jezero_heightmap_rg16.png`,
  `jezero_slope_degrees.png`, `jezero_metadata.json`.
- **Imagery:** Trek WMTS global + regional layers already integrated.
- **Rover track:** MMGIS `M20_waypoints.json` snapshot already committed.

### 6.2 New engine modules (`src/engines/`)

| Engine | Responsibility |
| --- | --- |
| `terrain/slopeClass.ts` | Map slope° → difficulty class (`low`/`moderate`/`high`/`dangerous`) using thresholds from `SCIENTIFIC_MODELS.md` §6 |
| `terrain/costGrid.ts` | Build a traversable cost grid from the DEM + slope grid + user max slope + roughness override |
| `pathfinding/astar.ts` | A* on 8-connected grid with binary heap, corner-cut prevention, admissible heuristic |
| `pathfinding/costModel.ts` | Pandolf-derived metabolic energy per edge, Mars gravity + suit-penalty factors (documented assumptions) |
| `pathfinding/explain.ts` | Generate plain-language comparison vs. straight-line route |

### 6.3 Feature modules

- `features/hazard-analysis/HazardsPage.tsx` (currently placeholder) → render slope-class overlay,
  point inspector, roughness toggle, and assumptions panel.
- `features/route-planner/PlannerPage.tsx` (currently placeholder) → start/destination/stops
  picker, A* runner, route overlay, elevation profile (Recharts), alternative route, explanation
  panel.
- `features/mars-explorer/` → add hazard toggle to the existing layer manager; reuse the cursor
  inspector.

### 6.4 Optional Phase 4 add-on: Perseverance raw-images panel

Because the reverse-engineered feed works and is CORS-open, a small gallery panel can be added
without derailing the core terrain/routing work:

- New service: `services/nasa/perseveranceRawImages.ts` — zod schema for the RSS feed response,
  fetch wrapper with TanStack Query.
- New component: `features/mars-explorer/RawImagesPanel.tsx` — latest images by sol/camera,
  thumbnail grid, link to full image.
- Status label: `unofficial endpoint` + `derived`.

### 6.5 No-go items for Phase 4

- Do **not** implement a USGS geologic-map overlay unless a live service is discovered or the
  static image is manually georeferenced and validated.
- Do **not** add NASA Worldview/GIBS integration.
- Do **not** present the Curiosity Mount Sharp GIF as a route line.

---

## 7. Data-source registry updates

`docs/DATA_SOURCES.md` should be extended with:

1. A new section for the Perseverance raw-images reverse-engineered feed (status `available` with
   caveat).
2. An entry for the official NASA Mars Rover Photos API marked `unavailable` with the 404 note.
3. A portal entry for USGS planetary geologic mapping (status `portal`).
4. A note in the Mars Trek section that no Mars layers exist in GIBS/Worldview.

These updates are applied in the same commit as this report.

---

## 8. Implementation priorities

| Priority | Feature | Data source | DoD |
| --- | --- | --- | --- |
| P0 | Slope/difficulty overlay + point inspector | Committed DEM/slope PNGs | Unit tests for slope classes; UI badges show `measured`/`derived` |
| P0 | A* route planner with energy cost model | Committed DEM + `engines/pathfinding` | A* optimality/admissibility tests pass; <100 ms on target grid |
| P1 | Hazard page full UI (thresholds, roughness toggle) | DEM + Trek `mola_roughness` | All thresholds published in-app; assumptions panel visible |
| P1 | Route explanation + elevation profile | Route result | Recharts profile; plain-language explanation |
| P2 | Perseverance raw-images panel | Reverse-engineered RSS feed | Thumbnail grid; degrade on failure; label unofficial endpoint |
| P3 | Geologic-map portal link | USGS Astropedia | Link only, no live layer |

---

## 9. Risk register

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| NASA changes/removes the RSS feed | medium | low (P2 feature) | Cache last response; show friendly fallback |
| Trek tile timeouts (K-10) | low-medium | low | Existing retry + dark-tile mitigation |
| DEM coverage too small for long routes | low | medium | Enforce route bbox check; show coverage limits |
| Slope thresholds feel arbitrary to users | low | low | Publish thresholds, source, and calibration plan |
| No live geologic map service | certain | low | Portal link + static overlay deferred |

---

## 10. Attribution and references

- **NASA Mars Trek** — NASA/JPL-Caltech, Solar System Treks.
- **USGS Astrogeology** — Planetary Geologic Mapping GIS Hub; global Mars geologic map (1978)
  by USGS/NASA.
- **NASA Science** — Curiosity's Proposed Path up Mount Sharp article.
- **NASA Earthdata / GIBS** — verified Earth-only service.
- **NASA/JPL-Caltech/MSSS** — Mars Perseverance raw images gallery and image CDN.
- **ARES project** — independent educational project, not affiliated with NASA.

All coordinates in this report use east-positive longitudes in [−180, 180] (D-010).
