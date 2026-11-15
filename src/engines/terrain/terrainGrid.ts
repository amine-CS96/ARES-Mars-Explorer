import type { LatLon } from '@/types/geo'

/**
 * A regular lat/lon grid of Mars elevation data loaded from the pipeline outputs.
 *
 * All values are either measured (elevation, from the USGS CTX DTM) or derived (slope, from the
 * slope map or recomputed by finite differences). No values are invented.
 */

export interface TerrainGridBBox {
  west: number
  south: number
  east: number
  north: number
}

export interface TerrainGrid {
  /** Number of columns in the grid. */
  width: number
  /** Number of rows in the grid. */
  height: number
  /** Geographic bounds of the grid. */
  bbox: TerrainGridBBox
  /** Elevation in meters relative to the MOLA areoid, row-major. */
  elevation: Float32Array
  /** Slope in degrees, row-major (from the pipeline slope map). */
  slope: Float32Array
  /** Minimum elevation in the grid (meters). */
  minElevation: number
  /** Maximum elevation in the grid (meters). */
  maxElevation: number
  /**
   * Approximate horizontal size of one grid cell in meters, computed at the grid center latitude
   * using the Mars mean radius. This is a planning approximation; the true east-west scale varies
   * with latitude.
   */
  metersPerPixel: number
}

export interface TerrainGridSource {
  metadataUrl: string
  heightmapUrl: string
  slopeUrl: string
}

interface ElevationMetadata {
  elevation: { minMeters: number; maxMeters: number; kind: string }
  bbox: TerrainGridBBox
  product?: { width?: number; height?: number }
}

export interface GridExtent {
  width: number
  height: number
  bbox: TerrainGridBBox
}

export function latLonToGridIndex(
  grid: GridExtent,
  point: LatLon,
): { x: number; y: number } | null {
  const { bbox, width, height } = grid
  if (
    point.lon < bbox.west ||
    point.lon > bbox.east ||
    point.lat < bbox.south ||
    point.lat > bbox.north
  ) {
    return null
  }
  const x = ((point.lon - bbox.west) / (bbox.east - bbox.west)) * (width - 1)
  const y = ((bbox.north - point.lat) / (bbox.north - bbox.south)) * (height - 1)
  return { x: Math.max(0, Math.min(width - 1, Math.round(x))), y: Math.max(0, Math.min(height - 1, Math.round(y))) }
}

export function gridIndexToLatLon(grid: GridExtent, x: number, y: number): LatLon {
  const { bbox, width, height } = grid
  const lon = bbox.west + (x / (width - 1)) * (bbox.east - bbox.west)
  const lat = bbox.north - (y / (height - 1)) * (bbox.north - bbox.south)
  return { lat, lon }
}

export function sampleElevation(grid: TerrainGrid, point: LatLon): number | null {
  const idx = latLonToGridIndex(grid, point)
  if (!idx) return null
  return grid.elevation[idx.y * grid.width + idx.x]
}

export function sampleSlope(grid: TerrainGrid, point: LatLon): number | null {
  const idx = latLonToGridIndex(grid, point)
  if (!idx) return null
  return grid.slope[idx.y * grid.width + idx.x]
}

/**
 * Validate parsed DEM metadata. Guards against the deployment serving HTML (e.g. a 404 page
 * caught by an SPA rewrite) or truncated JSON, which previously surfaced as cryptic
 * "Unexpected token" errors. Throws descriptive errors instead.
 */
export function parseElevationMetadata(raw: unknown): ElevationMetadata {
  const meta = raw as ElevationMetadata | null
  if (!meta || typeof meta !== 'object') {
    throw new Error('DEM metadata is not a JSON object (the server may have returned HTML)')
  }
  const { elevation, bbox } = meta
  if (
    !elevation ||
    !Number.isFinite(elevation.minMeters) ||
    !Number.isFinite(elevation.maxMeters) ||
    elevation.minMeters >= elevation.maxMeters
  ) {
    throw new Error('DEM metadata has invalid elevation range (min/max missing or inverted)')
  }
  if (
    !bbox ||
    ![bbox.west, bbox.south, bbox.east, bbox.north].every(Number.isFinite) ||
    bbox.west >= bbox.east ||
    bbox.south >= bbox.north
  ) {
    throw new Error('DEM metadata has an invalid geographic bbox')
  }
  return meta
}

async function fetchElevationMetadata(url: string): Promise<ElevationMetadata> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`DEM metadata request failed: HTTP ${res.status} for ${url}`)
  }
  const contentType = res.headers.get('content-type') ?? ''
  if (!contentType.includes('json')) {
    throw new Error(
      `DEM metadata returned unexpected content type "${contentType}" for ${url} (expected JSON)`,
    )
  }
  let raw: unknown
  try {
    raw = await res.json()
  } catch {
    throw new Error(`DEM metadata is not valid JSON for ${url}`)
  }
  return parseElevationMetadata(raw)
}

/** Load an image and return an HTMLImageElement. */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      if (img.width === 0 || img.height === 0) {
        reject(new Error(`Image decoded with zero dimensions: ${src}`))
        return
      }
      resolve(img)
    }
    img.onerror = () =>
      reject(new Error(`Failed to load DEM raster image (check HTTP status / file presence): ${src}`))
    img.src = src
  })
}

/** Decode the RG-encoded 16-bit elevation PNG into meters. */
function decodeElevationGrid(
  image: HTMLImageElement,
  minMeters: number,
  maxMeters: number,
): { pixels: Float32Array; width: number; height: number } {
  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D unavailable')
  ctx.drawImage(image, 0, 0)
  const imageData = ctx.getImageData(0, 0, image.width, image.height).data
  const count = image.width * image.height
  const pixels = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    const r = imageData[i * 4]
    const g = imageData[i * 4 + 1]
    const u16 = r + (g << 8)
    pixels[i] = minMeters + (u16 / 65535) * (maxMeters - minMeters)
  }
  return { pixels, width: image.width, height: image.height }
}

/** Decode the 8-bit grayscale slope PNG into degrees (0–90). */
function decodeSlopeGrid(image: HTMLImageElement): Float32Array {
  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D unavailable')
  ctx.drawImage(image, 0, 0)
  const imageData = ctx.getImageData(0, 0, image.width, image.height).data
  const count = image.width * image.height
  const pixels = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    pixels[i] = (imageData[i * 4] / 255) * 90
  }
  return pixels
}

/** Approximate meters per pixel at the center latitude of the grid. */
function computeMetersPerPixel(grid: TerrainGrid): number {
  const R = 3_389_500 // Mars mean radius in meters (NASA NSSDCA)
  const latRad = ((grid.bbox.south + grid.bbox.north) * 0.5 * Math.PI) / 180
  const eastWestMeters = ((grid.bbox.east - grid.bbox.west) * (Math.PI / 180)) * R * Math.cos(latRad)
  return eastWestMeters / grid.width
}

/** Load a complete terrain grid from the committed pipeline outputs. */
export async function loadTerrainGrid(source: TerrainGridSource): Promise<TerrainGrid> {
  const [metadata, heightmapImage, slopeImage] = await Promise.all([
    fetchElevationMetadata(source.metadataUrl),
    loadImage(source.heightmapUrl),
    loadImage(source.slopeUrl),
  ])

  // Cross-check the decoded rasters against each other and against the metadata's declared
  // product dimensions, so a truncated/corrupt asset fails loudly instead of producing a
  // silently wrong grid.
  const expectedW = metadata.product?.width
  const expectedH = metadata.product?.height
  if (expectedW != null && heightmapImage.width !== expectedW) {
    throw new Error(
      `Heightmap width ${heightmapImage.width} does not match metadata product width ${expectedW}`,
    )
  }
  if (expectedH != null && heightmapImage.height !== expectedH) {
    throw new Error(
      `Heightmap height ${heightmapImage.height} does not match metadata product height ${expectedH}`,
    )
  }
  if (heightmapImage.width !== slopeImage.width || heightmapImage.height !== slopeImage.height) {
    throw new Error(
      `Heightmap dimensions ${heightmapImage.width}×${heightmapImage.height} do not match slope map ${slopeImage.width}×${slopeImage.height}`,
    )
  }

  const elevation = decodeElevationGrid(
    heightmapImage,
    metadata.elevation.minMeters,
    metadata.elevation.maxMeters,
  )
  const slope = decodeSlopeGrid(slopeImage)

  let minElevation = Number.POSITIVE_INFINITY
  let maxElevation = Number.NEGATIVE_INFINITY
  for (let i = 0; i < elevation.pixels.length; i++) {
    const z = elevation.pixels[i]
    if (z < minElevation) minElevation = z
    if (z > maxElevation) maxElevation = z
  }

  const grid: TerrainGrid = {
    width: elevation.width,
    height: elevation.height,
    bbox: metadata.bbox,
    elevation: elevation.pixels,
    slope,
    minElevation,
    maxElevation,
    metersPerPixel: 0, // filled next
  }
  grid.metersPerPixel = computeMetersPerPixel(grid)
  return grid
}
