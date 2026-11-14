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
- **TileMatrixSet:** `default028mm`; zoom 0 = 2 cols × 1 row for global products.
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

Also catalogued (useful later): THEMIS Day IR 100 m (`THEMIS_DayIR_ControlledMosaics_100m_v2_oct2018`),
TES thermal inertia (`TES_Thermal_Inertia`), TES albedo, MOC Atlas, **Jezero HiRISE 25 cm
controlled mosaic** (`JEZ_hirise_soc_006_orthoMosaic_25cm_Eqc_latTs0_lon0_first_dd`, 🟡),
**Jezero CTX 6 m controlled mosaic** (`JEZ_ctx_B_soc_008_orthoMosaic_6m_Eqc_latTs0_lon0`, 🟡),
Jezero preliminary CTX (`Jezero_CTX_BlockAdj_dd`, 🟡), HiRISE "Ares 3 site" mosaic
(`ESP_040776_2115_RED_A_01_ORTHO`, 🟡 — real image of the fictional site's terrain).

> Regional layers 404 at global zoom levels (no coverage there). Their tile matrix/zoom range
> must come from each layer's `GetCapabilities` — this is Trek's own documented procedure.
> Do not hardcode regional tile URLs before that check (planned Phase 3).

## 2. MMGIS Perseverance waypoints — ✅ VERIFIED

- **URL:** https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_waypoints.json (✅ 200)
- **Provider:** NASA/JPL-Caltech, Mars 2020 "Where is Perseverance?" (MMGIS)
- **Content:** rover end-of-drive positions (waypoints) — used for the rover-track layer (C4)
  and to ground-truth Jezero POI coordinates.
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

## 4. Elevation data (Phase 3) — ⏳ PLANNED, no fabrication

- Trek serves *rendered* tiles, not raw DEMs. Raw elevation for Jezero will come from USGS PDS
  products (e.g. the Mars 2020 CTX/HiRISE DTMs catalogued via ODE) processed by our Node
  pipeline (`geotiff.js` + `sharp`) into heightmap PNGs + slope grids, cached under `public/data/`.
- Until a real DEM is processed, no elevation-based feature ships — or it ships explicitly
  labeled `SIMULATED` with a synthetic test grid. No exceptions.

## 5. Attribution text (shown in-app)

> Imagery and elevation: NASA/JPL-Caltech, NASA/USGS Astrogeology, NASA/GSFC (MOLA),
> NASA/JPL/ASU (THEMIS), NASA/JPL/MSSS (CTX), NASA/JPL/University of Arizona (HiRISE),
> ESA/DLR/FU Berlin (Mars Express HRSC). Waypoints: NASA/JPL MMGIS.
> ARES is an independent educational project, not affiliated with NASA.

## 6. Credits & references studied

- **Sol Atlas** (The SOL Explorers, Apache-2.0) — studied for architecture/data/science ideas;
  no code copied; its README's verification notes inspired our endpoint checks.
- **NASA Mars Trek** — tile services and API documentation (NASA/JPL).
- Fonts: Orbitron, Inter, JetBrains Mono (Google Fonts, OFL).
- Libraries: see `package.json` (all MIT/Apache-compatible).
