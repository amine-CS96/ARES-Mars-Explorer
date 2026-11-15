import type { LatLonBBox, TrekLayer } from './types'

/**
 * NASA Mars Trek WMTS provider.
 *
 * Tile template verified live on 2026-11-14 (HTTP 200) against the official API documentation:
 * https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars
 *
 * Template per the doc: {endpoint}/1.0.0/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.{ext}
 * For Mars equirectangular products the endpoint form is: /tiles/Mars/EQ/{layer}/...
 * TileMatrixSet: default028mm. Global products have 2 cols × 1 row at zoom 0.
 *
 * Regional products (e.g. Jezero mosaics) only serve tiles inside their bbox at zoom levels
 * covering the region — their correct matrix set/zoom range must be read from each layer's
 * WMTS GetCapabilities (do NOT guess; see docs/KNOWN_ISSUES.md K-3). Verified regional layers
 * are listed in `VERIFIED_REGIONAL_LAYERS`.
 */

export const TREK_TILE_BASE = 'https://trek.nasa.gov/tiles/Mars/EQ'
export const TREK_TILE_MATRIX_SET = 'default028mm'
export const TREK_TILE_STYLE = 'default'

export interface TileCoordinate {
  /** Zoom / TileMatrix index. */
  z: number
  /** Tile column. */
  x: number
  /** Tile row. */
  y: number
}

/** Build a verified WMTS tile URL. Pure function; unit-tested. */
export function buildTrekTileUrl(
  layer: Pick<TrekLayer, 'id' | 'format'>,
  tile: TileCoordinate,
): string {
  return `${TREK_TILE_BASE}/${layer.id}/1.0.0/${TREK_TILE_STYLE}/${TREK_TILE_MATRIX_SET}/${tile.z}/${tile.y}/${tile.x}.${layer.format}`
}

/**
 * Tile grid for the verified default028mm equirectangular matrix set.
 * Zoom z → 2^(z+1) columns × 2^z rows (verified for global layers and Jezero regional layers).
 */
export function tileGridForZoom(z: number): { cols: number; rows: number } {
  return { cols: 2 ** (z + 1), rows: 2 ** z }
}

/**
 * Return the tile coordinates covering a geographic bounding box at a given zoom.
 * Clamps to the global grid bounds. Used by the 2D/3D regional explorers.
 */
export function tilesForBbox(bbox: LatLonBBox, z: number): TileCoordinate[] {
  const { cols, rows } = tileGridForZoom(z)
  const minX = lonToTileX(bbox.west, z)
  const maxX = lonToTileX(bbox.east, z)
  const minY = latToTileY(bbox.north, z)
  const maxY = latToTileY(bbox.south, z)
  const tiles: TileCoordinate[] = []
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (x >= 0 && x < cols && y >= 0 && y < rows) tiles.push({ z, x, y })
    }
  }
  return tiles
}

function lonToTileX(lon: number, z: number): number {
  const { cols } = tileGridForZoom(z)
  return Math.max(0, Math.min(cols - 1, Math.floor(((lon + 180) / 360) * cols)))
}

function latToTileY(lat: number, z: number): number {
  const { rows } = tileGridForZoom(z)
  return Math.max(0, Math.min(rows - 1, Math.floor(((90 - lat) / 180) * rows)))
}

/**
 * Global Mars layers whose tile requests were verified live (docs/DATA_SOURCES.md §1).
 * These are safe to use for the Phase 2 globe and any global data surface.
 */
export const VERIFIED_GLOBAL_LAYERS: TrekLayer[] = [
  {
    id: 'Mars_MGS_MOLA_ClrShade_merge_global_463m',
    title: 'MGS MOLA — Global Color Hillshade',
    mission: 'Mars Global Surveyor',
    instrument: 'MOLA',
    resolutionMetersPerPixel: 463,
    format: 'jpg',
    scope: 'global',
    verified: true,
    attribution: 'NASA/JPL-Caltech/GSFC/MSSS · USGS Astrogeology (MOLA)',
    minZoom: 0,
    maxZoom: 7,
  },
  {
    id: 'Mars_Viking_MDIM21_ClrMosaic_global_232m',
    title: 'Viking MDIM 2.1 — Global Color Mosaic',
    mission: 'Viking Orbiters',
    instrument: 'VIS / MDIM 2.1',
    resolutionMetersPerPixel: 232,
    format: 'jpg',
    scope: 'global',
    verified: true,
    attribution: 'USGS Astrogeology · NASA/JPL (Viking MDIM 2.1)',
    minZoom: 0,
    maxZoom: 7,
  },
  {
    id: 'Mars_MOLA_blend200ppx_HRSC_ClrShade_clon0dd_200mpp_lzw',
    title: 'MOLA + HRSC — Color Hillshade Blend',
    mission: 'MGS + Mars Express',
    instrument: 'MOLA + HRSC',
    resolutionMetersPerPixel: 200,
    format: 'jpg',
    scope: 'global',
    verified: true,
    attribution: 'NASA/JPL/USGS · ESA/DLR/FU Berlin (Mars Express HRSC)',
    minZoom: 0,
    maxZoom: 8,
  },
  {
    id: 'THEMIS_NightIR_ControlledMosaics_100m_v2_oct2018',
    title: 'THEMIS — Night IR Global Mosaic',
    mission: 'Mars Odyssey',
    instrument: 'THEMIS',
    resolutionMetersPerPixel: 100,
    format: 'png',
    scope: 'global',
    verified: true,
    attribution: 'NASA/JPL-Caltech/ASU (THEMIS)',
    minZoom: 0,
    maxZoom: 9,
  },
  {
    id: 'mola_roughness',
    title: 'MGS MOLA — Global Surface Roughness',
    mission: 'Mars Global Surveyor',
    instrument: 'MOLA',
    resolutionMetersPerPixel: 463,
    format: 'png',
    scope: 'global',
    verified: true,
    attribution: 'NASA/JPL-Caltech/GSFC/MOLA Science Team',
    minZoom: 0,
    maxZoom: 7,
  },
]

/**
 * Regional Jezero layers whose GetCapabilities were parsed and tile requests verified live.
 * These must not be used outside their bbox / zoom range or they will 404.
 */
export const VERIFIED_REGIONAL_LAYERS: TrekLayer[] = [
  {
    id: 'JEZ_hirise_soc_006_orthoMosaic_25cm_Eqc_latTs0_lon0_first_dd',
    title: 'Jezero HiRISE Orthomosaic — 25 cm/px',
    mission: 'Mars Reconnaissance Orbiter',
    instrument: 'HiRISE',
    resolutionMetersPerPixel: 0.25,
    format: 'png',
    scope: 'regional',
    verified: true,
    attribution: 'NASA/JPL-Caltech/University of Arizona (HiRISE) · USGS Astrogeology',
    minZoom: 14,
    maxZoom: 17,
    bbox: {
      west: 77.2229331,
      south: 18.3067994,
      east: 77.583964,
      north: 18.669315,
    },
  },
  {
    id: 'JEZ_ctx_B_soc_008_orthoMosaic_6m_Eqc_latTs0_lon0',
    title: 'Jezero CTX Orthomosaic — 6 m/px',
    mission: 'Mars Reconnaissance Orbiter',
    instrument: 'CTX',
    resolutionMetersPerPixel: 6,
    format: 'png',
    scope: 'regional',
    verified: true,
    attribution: 'NASA/JPL-Caltech/MSSS (CTX) · USGS Astrogeology',
    minZoom: 8,
    maxZoom: 13,
    bbox: {
      // CTX capabilities did not expose a WGS84 bbox; using the USGS DTM product bbox
      // (same source mosaic) as a safe, conservative fallback.
      west: 77.1605,
      south: 18.211,
      east: 77.699,
      north: 18.7212,
    },
  },
]

export const ALL_VERIFIED_LAYERS: TrekLayer[] = [
  ...VERIFIED_GLOBAL_LAYERS,
  ...VERIFIED_REGIONAL_LAYERS,
]

/** Convenience accessors used by data surfaces (dashboard hero, globe, explorer). */
export function getVerifiedLayer(id: string): TrekLayer | undefined {
  return ALL_VERIFIED_LAYERS.find((l) => l.id === id)
}

export const MOLA_COLOR_HILLSHADE = getVerifiedLayer('Mars_MGS_MOLA_ClrShade_merge_global_463m')!
