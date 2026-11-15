# DATA_SOURCES

Every dataset ARES uses or plans to use, with verification status. **Nothing here is invented** —
each entry was checked against an official source during Phase 0 (2026-11-14), with live HTTP
verification from this build environment where possible.

Status legend: ✅ verified live · 🟡 catalog-verified (metadata from official catalog; tile URL
pattern still to be derived from the layer's WMTS GetCapabilities) · ⏳ planned · ❌ unreachable
from this environment (kept only if another verified source requires it).

## 1. Mars Trek WMTS tile services — ✅ VERIFIED

- **Provider:** NASA/JPL-Caltech — Solar System Treks
- **API doc:** https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars (✅ 200)
- **Tile template (official doc):**
  `https://{endpoint}/1.0.0/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.{ext}`
- **Verified concrete template (✅ 200 on `.../0/0/0.jpg`):**
  `https://trek.nasa.gov/tiles/Mars/EQ/{LAYER}/1.0.0/default/default028mm/{Z}/{ROW}/{COL}.{ext}`
- **TileMatrixSet:** `default028mm`; zoom 0 = 2 cols × 1 row for global products (2:1 grid:
  zoom z → `2^(z+1)` cols × `2^z` rows — verified live at zoom 0 (MOLA), zoom 1 (Viking, HRSC)
  and zoom 3 during Phase 2 globe composition).
- **CORS:** `Access-Control-Allow-Origin: *` on tile responses (verified 2026-11-14 with an
  `Origin: http://localhost:5173` request) — tiles are safe for WebGL textures and client-side
  canvas composites (`crossOrigin='anonymous'`; see `docs/KNOWN_ISSUES.md` K-6 resolution and
  `docs/DECISIONS.md` D-011).
- **Layer catalog:** 146 Mars products fetched from
  `https://trek.nasa.gov/mars/TrekServices/ws/index/eq/searchItems?...` (✅ 200, 336 KB JSON) —
  titles, missions, instruments captured in the run log; the catalog is the source of truth.

### Verified global layers (live tile check 2026-11-14)

| Layer ID | Title | Mission/Instrument | Res. | Ext. | Check |
| --- | --- | --- | --- | --- | --- |
| `Mars_MGS_MOLA_ClrShade_merge_global_463m` | MGS MOLA, Global Color Hillshade | MGS / MOLA | 463 m/px | jpg | ✅ 200 |
| `Mars_Viking_MDIM21_ClrMosaic_global_232m` | Viking VIS, Global Color Mosaic | Viking / MDIM 2.1 | 232 m/px | jpg | ✅ 200 |
| `Mars_MOLA_blend200ppx_HRSC_ClrShade_clon0dd_200mpp_lzw` | MOLA+HRSC Color Hillshade Blend | MGS+MEX / MOLA+HRSC | 200 m/px | jpg | ✅ 200 |
| `THEMIS_NightIR_ControlledMosaics_100m_v2_oct2018` | THEMIS-IR Night Global Mosaic | Odyssey / THEMIS | 100 m/px | png | ✅ 200 |
| `mola_roughness` | MGS MOLA, Global Surface Roughness | MGS / MOLA | ~463 m/px | png | ✅ 200 |

### Verified regional layers — Jezero (live tile check 2026-11-14)

GetCapabilities parsed and individual tiles requested live. Both use the same `default028mm`
matrix set as global layers; tiles 404 outside the product bbox.

| Layer ID | Title | Mission/Instrument | Res. | Ext. | Zoom range | WGS84 bbox | Check |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `JEZ_hirise_soc_006_orthoMosaic_25cm_Eqc_latTs0_lon0_first_dd` | Jezero HiRISE 25 cm Orthomosaic | MRO / HiRISE | 0.25 m/px | png | 14–17 | 77.2229°E–77.5840°E, 18.3068°N–18.6693°N | ✅ 200 |
| `JEZ_ctx_B_soc_008_orthoMosaic_6m_Eqc_latTs0_lon0` | Jezero CTX 6 m Orthomosaic | MRO / CTX | 6 m/px | png | 8–13 | (no WGS84 bbox in Capabilities; uses USGS DTM bbox 77.1605°E–77.699°E, 18.211°N–18.7212°N as conservative proxy) | ✅ 200 |

Also catalogued (useful later): THEMIS Day IR 100 m (`THEMIS_DayIR_ControlledMosaics_100m_v2_oct2018`),
TES thermal inertia (`TES_Thermal_Inertia`), TES albedo, MOC Atlas, Jezero preliminary CTX
(`Jezero_CTX_BlockAdj_dd`, 🟡), HiRISE "Ares 3 site" mosaic
(`ESP_040776_2115_RED_A_01_ORTHO`, 🟡 — real image of the fictional site's terrain).

## 2. MMGIS Perseverance waypoints — ✅ VERIFIED

- **URL:** https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_waypoints.json (✅ 200)
- **Provider:** NASA/JPL-Caltech, Mars 2020 "Where is Perseverance?" (MMGIS)
- **Content:** rover end-of-drive positions (waypoints) — used for the rover-track layer (C4)
  and to ground-truth Jezero POI coordinates.
- **Committed snapshot:** `public/data/M20_waypoints.json` (589 kB GeoJSON FeatureCollection).
- **Kind:** static JSON snapshot at fetch time.

## 3. Reference data (numbers, coordinates)

| Source | Use | Status |
| --- | --- | --- |
| NASA NSSDCA Mars Fact Sheet — https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html (✅ 200) | planetary statistics (radius, gravity, sol, tilt, atmosphere…) | ✅ |
| USGS Gazetteer of Planetary Nomenclature — https://planetarynames.wr.usgs.gov/ (✅ 200) | feature names/coords (Olympus Mons, Valles Marineris…) | ✅ |
| NASA/JPL Mars 2020 site — https://mars.nasa.gov/mars2020/ (⇒ 302 redirect; acceptable citation) | Perseverance mission context | 🟡 |
| NASA GISS Mars24 — https://www.giss.nasa.gov/tools/mars24/ (✅ 200) | Mars timekeeping algorithm (Allison & McEwen 2000) | ✅ |
| Mars Orbital Data Explorer — https://ode.rsl.wustl.edu/mars/ (✅ 200) | PDS data discovery portal for DEMs (Phase 3) | ✅ |
| NASA Open APIs — https://api.nasa.gov/ (✅ 200) | key registration; DONKI space weather (optional, Phase 5+) | ✅ |
| HiRISE — https://hirise.lpl.arizona.edu/ | HiRISE imagery portal | ❌ unreachable from this env; not cited in data until reachable |
| science.nasa.gov/mars | general Mars science | ❌ unreachable; **not used** |

## 4. Elevation data — ✅ VERIFIED (Jezero CTX 20 m DTM)

- **Product:** Mars 2020 Terrain Relative Navigation CTX DTM Mosaic
- **Direct download (✅ 200, 9.2 MB):**
  `https://planetarymaps.usgs.gov/mosaic/mars2020_trn/CTX/JEZ_ctx_B_soc_008_DTM_MOLAtopography_DeltaGeoid_20m_Eqc_latTs0_lon0.tif`
  (redirects to `asc-pds-services.s3.us-west-2.amazonaws.com`; fetched with `curl -L`).
- **Provider:** USGS Astrogeology Science Center
- **Citation:** Fergason, R. L., Hare, T. M., Mayer, D. P., Galuszka, D. M., Redding, B. L.,
  Smith, E. D., Shinaman, J. R., Cheng, Y., Otero, R. E., 2020
- **DOI:** https://doi.org/10.5066/P906QQT8
- **Resolution:** 20 m/px; 1596 × 1512 pixels; equirectangular (latTs=0); vertical reference is
  MOLA areoid.
- **Pipeline:** Node script `scripts/build-jezero-terrain.mjs` (`geotiff.js` + `sharp`) reads the
  GeoTIFF and writes:
  - `public/data/jezero_heightmap_rg16.png` — 8-bit RGB PNG with 16-bit elevation packed into
    R (low byte) + G (high byte); B unused. Range −2710.70 m to −1515.54 m; round-trip error
    < 0.01 m against source.
  - `public/data/jezero_slope_degrees.png` — 8-bit grayscale slope (degrees / 90 × 255).
  - `public/data/jezero_metadata.json` — source, bbox, encoding, slope thresholds.
- **Higher-res option identified (not used due to size):** Mars 2020 TRN HiRISE DTM Mosaic,
  1 m/px, 1.75 GB GeoTIFF at
  `https://planetarymaps.usgs.gov/mosaic/mars2020_trn/HiRISE/JEZ_hirise_soc_006_DTM_MOLAtopography_DeltaGeoid_1m_Eqc_latTs0_lon0_blend40.tif`.

> Trek serves *rendered* tiles, not raw DEMs. All elevation values in Module C come from the
> verified USGS CTX DTM above; none are fabricated.

## 5. Phase 4 — additional resources investigated 2026-11-14

### 5.1 USGS-NASA Planetary Geologic Mapping — ⚠️ portal + static downloads only

- **Portal:** https://astrogeology-usgs.hub.arcgis.com/ (✅ 200)
- **Interactive maps page:** https://astrogeology-usgs.hub.arcgis.com/pages/interactive-maps-mars (✅ 200)
- **Global Mars geologic map page:** https://astrogeology.usgs.gov/search/map/mars_geologic_map (✅ 200)
- **Download products:** PDF (`mars-geologic-map.pdf`, 6.79 MB) and `full.jpg` offered from the
  Astropedia record; source citation: USGS Astrogeology Science Center.
- **Public ArcGIS REST / tile service:** **not found.** Probed `https://astrogeology.usgs.gov/arcgis/rest/services`
  and variant paths → 404. ArcGIS Hub search API for `q=Mars` returned `numberMatched: 0`.
- **Status:** `portal` — useful as a cited reference and outbound link; not a live map service
  ARES can consume directly. Any future geologic overlay must be a manually georeferenced static
  image, clearly labeled with vintage and provenance.

### 5.2 NASA Worldview / GIBS — ❌ no Mars layers

- **Portal:** https://worldview.earthdata.nasa.gov/ (✅ 200)
- **WMTS GetCapabilities:** `https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/wmts.cgi?SERVICE=WMTS&REQUEST=GetCapabilities` (✅ 200, 5.3 MB XML)
- **Mars layers:** **0** matches for `mars|Mars|MARS` in the capabilities document.
- **Conclusion:** GIBS is Earth-only. ARES continues to use NASA Mars Trek WMTS for all Mars
  raster layers (D-011).

### 5.3 Mars Perseverance Raw Images Gallery — 🟡 official API down; alternative feed verified

- **Gallery:** https://mars.nasa.gov/mars2020/multimedia/raw-images/ (✅ 200)
- **Official public API:** `https://api.nasa.gov/mars-photos/api/v1/...` (❌ 404 "No such app" —
  Heroku backend missing as of 2026-11-14).
- **Reverse-engineered JSON feed** (discovered in the gallery's JS bundle, verified live):
  ```
  https://mars.nasa.gov/rss/api/?feed=raw_images&category=mars2020,ingenuity&feedtype=json&ver=1.2&num={n}&page={p}&order=sol+desc&extended=sample_type::full
  ```
  (✅ 200, `Content-Type: application/json;charset=UTF-8`, `Access-Control-Allow-Origin: *`)
- **Observed payload fields:** `imageid`, `sol`, `camera.instrument`, `date_taken_utc`, `caption`,
  `image_files.{small,medium,large,full_res}`, `credit`.
- **Image CDN:** `https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/{SOL}/ids/edr/browse/{CAM}/{FILENAME}_{size}.jpg`
  (✅ 200; no CORS headers — use `<img>`, not canvas/WebGL).
- **Provider / credit:** NASA/JPL-Caltech/MSSS.
- **Status:** `available-unofficial` — the feed is not a documented public API, but it is
  discoverable from the official gallery, returns valid JSON, and allows cross-origin requests.
  ARES may consume it for a raw-images panel with explicit "unofficial endpoint" labeling and a
  graceful failure path.
- **Limitation:** the feed contains no latitude/longitude per image, so thumbnails cannot be
  accurately placed on the map without a separate verified camera-geometry source.

## 6. Attribution text (shown in-app)

> Imagery and elevation: NASA/JPL-Caltech, NASA/USGS Astrogeology, NASA/GSFC (MOLA),
> NASA/JPL/ASU (THEMIS), NASA/JPL/MSSS (CTX), NASA/JPL/University of Arizona (HiRISE),
> ESA/DLR/FU Berlin (Mars Express HRSC). Rover waypoints and raw images: NASA/JPL-Caltech/MSSS.
> ARES is an independent educational project, not affiliated with NASA.

## 7. Credits & references studied

- **Sol Atlas** (The SOL Explorers, Apache-2.0) — studied for architecture/data/science ideas;
  no code copied; its README's verification notes inspired our endpoint checks.
- **NASA Mars Trek** — tile services and API documentation (NASA/JPL).
- Fonts: Orbitron, Inter, JetBrains Mono (Google Fonts, OFL).
- Libraries: see `package.json` (all MIT/Apache-compatible).
