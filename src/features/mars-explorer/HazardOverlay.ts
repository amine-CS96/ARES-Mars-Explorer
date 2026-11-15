import { SLOPE_CLASS_COLORS, slopeClass } from '@/engines/terrain/slopeClass'
import type { TerrainGrid } from '@/engines/terrain/terrainGrid'
import type { MapOverlay } from './TileMap'

/**
 * Build a transparent hazard overlay canvas from a terrain grid.
 *
 * Each grid cell is colored by its slope class. The overlay is geographic and is drawn scaled to
 * the DEM bbox by TileMap. The result is `derived` from the measured DEM.
 */
export function buildHazardOverlay(grid: TerrainGrid): MapOverlay {
  const canvas = document.createElement('canvas')
  canvas.width = grid.width
  canvas.height = grid.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D unavailable')

  const imageData = ctx.createImageData(grid.width, grid.height)
  const data = imageData.data

  for (let i = 0; i < grid.slope.length; i++) {
    const cls = slopeClass(grid.slope[i]).key
    const hex = SLOPE_CLASS_COLORS[cls]
    const r = Number.parseInt(hex.slice(1, 3), 16)
    const g = Number.parseInt(hex.slice(3, 5), 16)
    const b = Number.parseInt(hex.slice(5, 7), 16)
    const idx = i * 4
    data[idx] = r
    data[idx + 1] = g
    data[idx + 2] = b
    // Flat areas are nearly transparent; hazardous areas are more opaque.
    data[idx + 3] = cls === 'flat' ? 30 : cls === 'moderate' ? 90 : 160
  }

  ctx.putImageData(imageData, 0, 0)

  return {
    canvas,
    bbox: grid.bbox,
    opacity: 0.7,
  }
}
