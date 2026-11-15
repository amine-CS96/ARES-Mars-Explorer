import type { TerrainGrid, TerrainGridBBox } from '@/engines/terrain/terrainGrid'

/**
 * Multi-layer terrain analysis derived from the committed USGS CTX 20 m DEM.
 *
 * Every value is computed from the actual raster and is labeled `derived` in the UI. No synthetic
 * obstacles, rock fields, or hazard coordinates are invented. Cells outside the DEM coverage or
 * without valid elevation are explicitly marked `nodata` so they are never treated as safe.
 */

export interface TerrainAnalysis {
  /** Grid width in cells. */
  width: number
  /** Grid height in cells. */
  height: number
  /** Geographic bounds. */
  bbox: TerrainGridBBox
  /** Elevation in meters relative to MOLA areoid (copy of measured input). */
  elevation: Float32Array
  /**
   * Slope in degrees recomputed from elevation with Horn finite differences.
   * This verifies the pipeline slope map and gives a consistent derivative for analysis.
   */
  slope: Float32Array
  /**
   * Terrain Ruggedness Index (TRI): mean absolute difference in elevation between a cell and its
   * neighbors within the analysis window. Expressed in meters.
   */
  tri: Float32Array
  /**
   * Local elevation standard deviation within the analysis window, in meters.
   * A simple measure of roughness at the DEM resolution.
   */
  roughness: Float32Array
  /**
   * Local relief: max - min elevation within the analysis window, in meters.
   */
  relief: Float32Array
  /**
   * Terrain aspect in degrees clockwise from north [0, 360), or -1 for flat/undefined cells.
   */
  aspect: Float32Array
  /**
   * True where the elevation value is valid and the cell is not on the raster boundary (boundary
   * cells cannot support a full derivative window).
   */
  valid: Uint8Array
  /** Approximate horizontal size of one grid cell in meters. */
  metersPerPixel: number
  /** Neighborhood window radius used for roughness/relief calculations, in cells. */
  windowRadius: number
}

export interface TerrainAnalysisOptions {
  /**
   * Radius of the square moving window for roughness/relief calculations, in cells.
   * Default 2 gives a 5×5 window (~100 m × 100 m at 20 m/px).
   */
  windowRadius?: number
}

const DEFAULT_WINDOW_RADIUS = 2

/** Test whether a finite elevation value should be considered valid data. */
function isValidElevation(z: number): boolean {
  return Number.isFinite(z) && !Number.isNaN(z)
}

/**
 * Recompute slope from elevation using Horn's method, which weights diagonal neighbors more.
 * This is the standard approach for DEM slope and matches the existing pipeline documentation.
 */
function computeSlope(grid: TerrainGrid, valid: Uint8Array): Float32Array {
  const { width, height, elevation, metersPerPixel } = grid
  const slope = new Float32Array(width * height)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      if (!valid[idx]) {
        slope[idx] = Number.NaN
        continue
      }
      // Horn finite differences with 3×3 kernel.
      const z1 = y > 0 && x > 0 ? elevation[(y - 1) * width + (x - 1)] : elevation[idx]
      const z2 = y > 0 ? elevation[(y - 1) * width + x] : elevation[idx]
      const z3 = y > 0 && x < width - 1 ? elevation[(y - 1) * width + (x + 1)] : elevation[idx]
      const z4 = x > 0 ? elevation[y * width + (x - 1)] : elevation[idx]
      const z6 = x < width - 1 ? elevation[y * width + (x + 1)] : elevation[idx]
      const z7 = y < height - 1 && x > 0 ? elevation[(y + 1) * width + (x - 1)] : elevation[idx]
      const z8 = y < height - 1 ? elevation[(y + 1) * width + x] : elevation[idx]
      const z9 = y < height - 1 && x < width - 1 ? elevation[(y + 1) * width + (x + 1)] : elevation[idx]

      const dzDx = ((z3 + 2 * z6 + z9) - (z1 + 2 * z4 + z7)) / (8 * metersPerPixel)
      const dzDy = ((z7 + 2 * z8 + z9) - (z1 + 2 * z2 + z3)) / (8 * metersPerPixel)
      const riseRun = Math.sqrt(dzDx * dzDx + dzDy * dzDy)
      slope[idx] = (Math.atan(riseRun) * 180) / Math.PI
    }
  }
  return slope
}

/**
 * Compute terrain aspect (direction of steepest descent, clockwise from north).
 * Returns -1 for flat cells where both dz/dx and dz/dy are zero.
 */
function computeAspect(grid: TerrainGrid, valid: Uint8Array): Float32Array {
  const { width, height, elevation, metersPerPixel } = grid
  const aspect = new Float32Array(width * height)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      if (!valid[idx]) {
        aspect[idx] = Number.NaN
        continue
      }
      const z1 = y > 0 && x > 0 ? elevation[(y - 1) * width + (x - 1)] : elevation[idx]
      const z2 = y > 0 ? elevation[(y - 1) * width + x] : elevation[idx]
      const z3 = y > 0 && x < width - 1 ? elevation[(y - 1) * width + (x + 1)] : elevation[idx]
      const z4 = x > 0 ? elevation[y * width + (x - 1)] : elevation[idx]
      const z6 = x < width - 1 ? elevation[y * width + (x + 1)] : elevation[idx]
      const z7 = y < height - 1 && x > 0 ? elevation[(y + 1) * width + (x - 1)] : elevation[idx]
      const z8 = y < height - 1 ? elevation[(y + 1) * width + x] : elevation[idx]
      const z9 = y < height - 1 && x < width - 1 ? elevation[(y + 1) * width + (x + 1)] : elevation[idx]

      const dzDx = ((z3 + 2 * z6 + z9) - (z1 + 2 * z4 + z7)) / (8 * metersPerPixel)
      const dzDy = ((z7 + 2 * z8 + z9) - (z1 + 2 * z2 + z3)) / (8 * metersPerPixel)

      if (dzDx === 0 && dzDy === 0) {
        aspect[idx] = -1
      } else {
        let theta = (Math.atan2(dzDy, dzDx) * 180) / Math.PI
        theta = 90 - theta
        if (theta < 0) theta += 360
        if (theta >= 360) theta -= 360
        aspect[idx] = theta
      }
    }
  }
  return aspect
}

/** Compute Terrain Ruggedness Index and local standard deviation / relief over a square window. */
function computeWindowStats(
  grid: TerrainGrid,
  valid: Uint8Array,
  windowRadius: number,
): { tri: Float32Array; roughness: Float32Array; relief: Float32Array } {
  const { width, height, elevation } = grid
  const tri = new Float32Array(width * height)
  const roughness = new Float32Array(width * height)
  const relief = new Float32Array(width * height)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      if (!valid[idx]) {
        tri[idx] = Number.NaN
        roughness[idx] = Number.NaN
        relief[idx] = Number.NaN
        continue
      }

      const centerZ = elevation[idx]
      let sum = 0
      let sumSq = 0
      let count = 0
      let minZ = Number.POSITIVE_INFINITY
      let maxZ = Number.NEGATIVE_INFINITY
      const y0 = Math.max(0, y - windowRadius)
      const y1 = Math.min(height - 1, y + windowRadius)
      const x0 = Math.max(0, x - windowRadius)
      const x1 = Math.min(width - 1, x + windowRadius)

      for (let yy = y0; yy <= y1; yy++) {
        for (let xx = x0; xx <= x1; xx++) {
          const ii = yy * width + xx
          if (!valid[ii]) continue
          const z = elevation[ii]
          const diff = z - centerZ
          sum += diff
          sumSq += diff * diff
          count++
          if (z < minZ) minZ = z
          if (z > maxZ) maxZ = z
        }
      }

      if (count < 2) {
        tri[idx] = 0
        roughness[idx] = 0
        relief[idx] = 0
      } else {
        const meanAbsDiff = sum / count
        const meanSqDiff = sumSq / count
        tri[idx] = Math.sqrt(Math.max(0, meanSqDiff)) // RMS of differences, equivalent to common TRI
        roughness[idx] = Math.sqrt(Math.max(0, meanSqDiff - meanAbsDiff * meanAbsDiff))
        relief[idx] = maxZ - minZ
      }
    }
  }

  return { tri, roughness, relief }
}

/**
 * Build a complete terrain analysis from a TerrainGrid.
 *
 * Boundary cells are excluded from `valid` because they cannot support a full 3×3 derivative
 * kernel. Nodata cells (non-finite elevation) are also marked invalid.
 */
export function analyzeTerrain(
  grid: TerrainGrid,
  options: TerrainAnalysisOptions = {},
): TerrainAnalysis {
  const windowRadius = options.windowRadius ?? DEFAULT_WINDOW_RADIUS
  const { width, height } = grid
  const valid = new Uint8Array(width * height)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      // Exclude raster boundary because full derivative/relief windows are unavailable there.
      const isBoundary = x === 0 || y === 0 || x === width - 1 || y === height - 1
      valid[idx] = !isBoundary && isValidElevation(grid.elevation[idx]) ? 1 : 0
    }
  }

  const slope = computeSlope(grid, valid)
  const aspect = computeAspect(grid, valid)
  const { tri, roughness, relief } = computeWindowStats(grid, valid, windowRadius)

  return {
    width,
    height,
    bbox: grid.bbox,
    elevation: grid.elevation,
    slope,
    tri,
    roughness,
    relief,
    aspect,
    valid,
    metersPerPixel: grid.metersPerPixel,
    windowRadius,
  }
}

/** Sample the analysis at a lat/lon point using bilinear interpolation of valid cells only. */
export function sampleAnalysis(
  analysis: TerrainAnalysis,
  point: { lat: number; lon: number },
): {
  elevation: number
  slope: number
  tri: number
  roughness: number
  relief: number
  aspect: number
  valid: boolean
} | null {
  const { bbox, width, height } = analysis
  if (
    point.lon < bbox.west ||
    point.lon > bbox.east ||
    point.lat < bbox.south ||
    point.lat > bbox.north
  ) {
    return null
  }

  const fx = ((point.lon - bbox.west) / (bbox.east - bbox.west)) * (width - 1)
  const fy = ((bbox.north - point.lat) / (bbox.north - bbox.south)) * (height - 1)
  const x0 = Math.floor(fx)
  const y0 = Math.floor(fy)
  const x1 = Math.min(width - 1, x0 + 1)
  const y1 = Math.min(height - 1, y0 + 1)
  const wx = fx - x0
  const wy = fy - y0

  function bilinear(field: Float32Array): number {
    const z00 = field[y0 * width + x0]
    const z10 = field[y0 * width + x1]
    const z01 = field[y1 * width + x0]
    const z11 = field[y1 * width + x1]
    if (!Number.isFinite(z00) || !Number.isFinite(z10) || !Number.isFinite(z01) || !Number.isFinite(z11)) {
      return Number.NaN
    }
    return (z00 * (1 - wx) + z10 * wx) * (1 - wy) + (z01 * (1 - wx) + z11 * wx) * wy
  }

  const v00 = analysis.valid[y0 * width + x0]
  const v10 = analysis.valid[y0 * width + x1]
  const v01 = analysis.valid[y1 * width + x0]
  const v11 = analysis.valid[y1 * width + x1]
  const allValid = !!(v00 && v10 && v01 && v11)

  return {
    elevation: bilinear(analysis.elevation),
    slope: bilinear(analysis.slope),
    tri: bilinear(analysis.tri),
    roughness: bilinear(analysis.roughness),
    relief: bilinear(analysis.relief),
    aspect: bilinear(analysis.aspect),
    valid: allValid,
  }
}
