import type { TrekLayer } from '@/services/nasa/types'
import {
  VERIFIED_REGIONAL_LAYERS,
  type TileCoordinate,
  tilesForBbox,
} from '@/services/nasa/marsTrekProvider'

/**
 * Region configuration for Jezero Crater (Module C).
 * All values are either verified from official sources or explicitly labeled.
 */

export interface RegionConfig {
  id: string
  name: string
  description: string
  center: { lat: number; lon: number }
  defaultZoom: number
  minZoom: number
  maxZoom: number
  bbox: { west: number; south: number; east: number; north: number }
  layers: TrekLayer[]
  dem: {
    metadataPath: string
    heightmapPath: string
    slopePath: string
  }
  roverTrackPath: string
}

export const JEZERO_CONFIG: RegionConfig = {
  id: 'jezero',
  name: 'Jezero Crater',
  description:
    'Perseverance rover landing site and exploration area. Imagery from Mars Trek regional HiRISE/CTX WMTS; elevation from the USGS CTX 20 m DTM mosaic.',
  center: { lat: 18.44, lon: 77.45 },
  defaultZoom: 12,
  minZoom: 8,
  maxZoom: 17,
  bbox: {
    west: 77.1605,
    south: 18.211,
    east: 77.699,
    north: 18.7212,
  },
  layers: VERIFIED_REGIONAL_LAYERS,
  dem: {
    metadataPath: '/data/jezero_metadata.json',
    heightmapPath: '/data/jezero_heightmap_rg16.png',
    slopePath: '/data/jezero_slope_degrees.png',
  },
  roverTrackPath: '/data/M20_waypoints.json',
}

/** Tiles covering the region bbox at a given zoom — used for 2D/3D compositing. */
export function regionTiles(config: RegionConfig, zoom: number): TileCoordinate[] {
  return tilesForBbox(config.bbox, zoom)
}
