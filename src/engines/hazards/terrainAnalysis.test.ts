import { describe, expect, it } from 'vitest'
import { analyzeTerrain, sampleAnalysis } from './terrainAnalysis'
import type { TerrainGrid } from '@/engines/terrain/terrainGrid'

function makeGrid(elevation: number[][]): TerrainGrid {
  const height = elevation.length
  const width = elevation[0]?.length ?? 0
  const flat = new Float32Array(height * width)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      flat[y * width + x] = elevation[y][x]
    }
  }
  return {
    width,
    height,
    bbox: { west: 0, south: 0, east: 1, north: 1 },
    elevation: flat,
    slope: new Float32Array(height * width),
    minElevation: Math.min(...flat),
    maxElevation: Math.max(...flat),
    metersPerPixel: 20,
  }
}

describe('analyzeTerrain', () => {
  it('marks boundary cells as invalid', () => {
    const grid = makeGrid([
      [1, 1, 1, 1, 1],
      [1, 2, 2, 2, 1],
      [1, 2, 3, 2, 1],
      [1, 2, 2, 2, 1],
      [1, 1, 1, 1, 1],
    ])
    const analysis = analyzeTerrain(grid)
    expect(analysis.valid[0]).toBe(0) // top-left corner
    expect(analysis.valid[2 * 5 + 2]).toBe(1) // center
    expect(analysis.valid[2]).toBe(0) // top edge
  })

  it('computes zero slope for a flat plane', () => {
    const grid = makeGrid([
      [5, 5, 5, 5, 5],
      [5, 5, 5, 5, 5],
      [5, 5, 5, 5, 5],
      [5, 5, 5, 5, 5],
      [5, 5, 5, 5, 5],
    ])
    const analysis = analyzeTerrain(grid)
    const center = 2 * 5 + 2
    expect(analysis.slope[center]).toBeCloseTo(0, 5)
    expect(analysis.aspect[center]).toBe(-1)
  })

  it('computes a non-zero slope for a constant eastward ramp', () => {
    // Eastward ramp: dz/dx positive, dz/dy zero.
    const grid = makeGrid([
      [0, 1, 2, 3, 4],
      [0, 1, 2, 3, 4],
      [0, 1, 2, 3, 4],
      [0, 1, 2, 3, 4],
      [0, 1, 2, 3, 4],
    ])
    const analysis = analyzeTerrain(grid)
    const center = 2 * 5 + 2
    // Each cell is 20 m, dz/dx = 1 m / 20 m = 0.05, slope ≈ 2.86°.
    expect(analysis.slope[center]).toBeGreaterThan(2)
    expect(analysis.slope[center]).toBeLessThan(4)
  })

  it('computes local relief for a central peak', () => {
    const grid = makeGrid([
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 20, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ])
    const analysis = analyzeTerrain(grid, { windowRadius: 1 })
    const center = 2 * 5 + 2
    expect(analysis.relief[center]).toBe(20)
  })

  it('treats NaN elevation as nodata', () => {
    const grid = makeGrid([
      [1, 1, 1],
      [1, Number.NaN, 1],
      [1, 1, 1],
    ])
    const analysis = analyzeTerrain(grid)
    expect(analysis.valid[1 * 3 + 1]).toBe(0)
    expect(Number.isNaN(analysis.slope[1 * 3 + 1])).toBe(true)
  })
})

describe('sampleAnalysis', () => {
  it('returns null outside the bbox', () => {
    const grid = makeGrid([
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1],
    ])
    const analysis = analyzeTerrain(grid)
    expect(sampleAnalysis(analysis, { lat: 2, lon: 0.5 })).toBeNull()
  })

  it('interpolates values at the center', () => {
    const grid = makeGrid([
      [0, 0, 0, 0, 0],
      [0, 1, 1, 1, 0],
      [0, 1, 2, 1, 0],
      [0, 1, 1, 1, 0],
      [0, 0, 0, 0, 0],
    ])
    const analysis = analyzeTerrain(grid)
    const sample = sampleAnalysis(analysis, { lat: 0.5, lon: 0.5 })
    expect(sample).not.toBeNull()
    expect(sample!.elevation).toBeGreaterThan(0)
    expect(sample!.valid).toBe(true)
  })
})
