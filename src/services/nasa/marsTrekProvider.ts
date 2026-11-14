import type { TrekLayer } from './types'

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
 * WMTS GetCapabilities (do NOT guess; see docs/KNOWN_ISSUES.md K-3).
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
  },
]

/** Convenience accessors used by data surfaces (dashboard hero, globe). */
export function getVerifiedLayer(id: string): TrekLayer | undefined {
  return VERIFIED_GLOBAL_LAYERS.find((l) => l.id === id)
}

export const MOLA_COLOR_HILLSHADE = getVerifiedLayer('Mars_MGS_MOLA_ClrShade_merge_global_463m')!
