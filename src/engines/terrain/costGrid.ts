import type { TerrainGrid, TerrainGridBBox } from './terrainGrid'
import { slopeClass, type SlopeClassKey } from './slopeClass'

/**
 * A coarser, route-ready grid derived from a full-resolution TerrainGrid.
 *
 * The DEM is downsampled to a target size suitable for real-time A* (default 256 × 256),
 * slope is recomputed by central differences on the downsampled elevation, and each cell is
 * assigned a difficulty class. Edge costs are computed on demand by the pathfinding engine using
 * the elevation values and the chosen cost model.
 */

export type Difficulty = SlopeClassKey

export interface CostGrid {
  width: number
  height: number
  bbox: TerrainGridBBox
  /** Downsampled elevation in meters, row-major. */
  elevation: Float32Array
  /** Slope in degrees recomputed from the downsampled elevation. */
  slope: Float32Array
  /** Difficulty class per cell. */
  difficulty: Uint8Array
  /** Approximate horizontal size of one cell in meters. */
  metersPerPixel: number
  /** True if the user has chosen to allow routing through `hazardous` cells. */
  dangerousAllowed: boolean
}

/** Numeric encoding of difficulty for fast array storage. */
const DIFFICULTY_INDEX: Record<Difficulty, number> = {
  flat: 0,
  moderate: 1,
  steep: 2,
  hazardous: 3,
}

export function difficultyFromIndex(index: number): Difficulty {
  const keys: Difficulty[] = ['flat', 'moderate', 'steep', 'hazardous']
  return keys[index] ?? 'hazardous'
}

export interface CostGridOptions {
  /** Maximum cells along the longer axis. The shorter axis is scaled to preserve aspect ratio. */
  maxCells?: number
  /** If true, hazardous cells are traversable but flagged in the result. */
  allowDangerous?: boolean
}

function bilinearSample(
  src: Float32Array,
  srcW: number,
  srcH: number,
  x: number,
  y: number,
): number {
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const x1 = Math.min(srcW - 1, x0 + 1)
  const y1 = Math.min(srcH - 1, y0 + 1)
  const fx = x - x0
  const fy = y - y0
  const z00 = src[y0 * srcW + x0]
  const z10 = src[y0 * srcW + x1]
  const z01 = src[y1 * srcW + x0]
  const z11 = src[y1 * srcW + x1]
  return (z00 * (1 - fx) + z10 * fx) * (1 - fy) + (z01 * (1 - fx) + z11 * fx) * fy
}

/**
 * Resample and crop a TerrainGrid into a smaller CostGrid, then recompute slope and difficulty.
 */
export function buildCostGrid(grid: TerrainGrid, options: CostGridOptions = {}): CostGrid {
  const { maxCells = 256, allowDangerous = false } = options

  const aspect = grid.width / grid.height
  let width: number
  let height: number
  if (aspect >= 1) {
    width = Math.min(grid.width, maxCells)
    height = Math.max(1, Math.round(width / aspect))
  } else {
    height = Math.min(grid.height, maxCells)
    width = Math.max(1, Math.round(height * aspect))
  }

  const elevation = new Float32Array(width * height)
  for (let y = 0; y < height; y++) {
    const srcY = (y / (height - 1)) * (grid.height - 1)
    for (let x = 0; x < width; x++) {
      const srcX = (x / (width - 1)) * (grid.width - 1)
      elevation[y * width + x] = bilinearSample(grid.elevation, grid.width, grid.height, srcX, srcY)
    }
  }

  // Recompute slope from the downsampled elevation using central differences.
  const slope = new Float32Array(width * height)
  const metersPerPixel = grid.metersPerPixel * (grid.width / width)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      const z = elevation[idx]
      const zW = x > 0 ? elevation[idx - 1] : z
      const zE = x < width - 1 ? elevation[idx + 1] : z
      const zN = y > 0 ? elevation[idx - width] : z
      const zS = y < height - 1 ? elevation[idx + width] : z
      const dzDx = (zE - zW) / (2 * metersPerPixel)
      const dzDy = (zS - zN) / (2 * metersPerPixel)
      slope[idx] = (Math.atan(Math.sqrt(dzDx * dzDx + dzDy * dzDy)) * 180) / Math.PI
    }
  }

  const difficulty = new Uint8Array(width * height)
  for (let i = 0; i < slope.length; i++) {
    difficulty[i] = DIFFICULTY_INDEX[slopeClass(slope[i]).key]
  }

  return {
    width,
    height,
    bbox: grid.bbox,
    elevation,
    slope,
    difficulty,
    metersPerPixel,
    dangerousAllowed: allowDangerous,
  }
}

export function isCellTraversable(grid: CostGrid, x: number, y: number): boolean {
  if (x < 0 || x >= grid.width || y < 0 || y >= grid.height) return false
  const diff = difficultyFromIndex(grid.difficulty[y * grid.width + x])
  if (diff === 'hazardous' && !grid.dangerousAllowed) return false
  return true
}

export function cellSlope(grid: CostGrid, x: number, y: number): number {
  return grid.slope[y * grid.width + x]
}

export function cellElevation(grid: CostGrid, x: number, y: number): number {
  return grid.elevation[y * grid.width + x]
}
