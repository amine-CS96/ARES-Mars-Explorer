/**
 * Mars Trek layer descriptor. `verified` means the tile URL pattern was confirmed live from
 * this environment (docs/DATA_SOURCES.md). Regional layers exist in the Trek catalog but are
 * not added until their GetCapabilities are parsed.
 */
export interface TrekLayer {
  id: string
  title: string
  mission: string
  instrument: string
  resolutionMetersPerPixel: number
  format: 'jpg' | 'png'
  scope: 'global' | 'regional'
  verified: boolean
}
