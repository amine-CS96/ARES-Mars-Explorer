/**
 * Mars Trek layer descriptor. `verified` means the tile URL pattern was confirmed live from
 * this environment (docs/DATA_SOURCES.md). Regional layers exist in the Trek catalog but are
 * not added until their GetCapabilities are parsed.
 */

export interface LatLonBBox {
  west: number
  south: number
  east: number
  north: number
}

export interface TrekLayer {
  id: string
  title: string
  mission: string
  instrument: string
  resolutionMetersPerPixel: number
  format: 'jpg' | 'png'
  scope: 'global' | 'regional'
  verified: boolean
  /** Attribution line rendered next to the layer (owner / mission / instrument). */
  attribution: string
  /** Valid zoom range for this layer (regional layers may not serve all TMS levels). */
  minZoom?: number
  maxZoom?: number
  /** Geographic bounds in east-positive [-180, 180] degrees. Regional only. */
  bbox?: LatLonBBox
}
