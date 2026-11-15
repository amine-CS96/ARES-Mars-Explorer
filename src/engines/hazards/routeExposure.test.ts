import { describe, expect, it } from 'vitest'
import { computeRouteExposure, routePointToGridNode } from './routeExposure'
import { getProfileById } from './riskModel'
import type { PathNode } from '@/engines/pathfinding/astar'
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
    bbox: { west: 0, south: 0, east: 0.001, north: 0.001 },
    elevation: flat,
    slope: new Float32Array(height * width),
    minElevation: Math.min(...flat),
    maxElevation: Math.max(...flat),
    metersPerPixel: 20,
  }
}

describe('routePointToGridNode', () => {
  it('maps a lat/lon inside the bbox to a grid node', () => {
    const grid = makeGrid([
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1],
    ])
    const node = routePointToGridNode(grid, { lat: 0.0005, lon: 0.0005 })
    expect(node).not.toBeNull()
    expect(node!.x).toBe(1)
    expect(node!.y).toBe(1)
  })

  it('returns null outside the bbox', () => {
    const grid = makeGrid([[1]])
    expect(routePointToGridNode(grid, { lat: 2, lon: 2 })).toBeNull()
  })
})

describe('computeRouteExposure', () => {
  const standard = getProfileById('standard')

  it('returns zero-length exposure for an empty path', () => {
    const grid = makeGrid([
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1],
    ])
    const result = computeRouteExposure([], grid, standard)
    expect(result.segments.length).toBe(0)
    expect(result.totalDistanceM).toBe(0)
  })

  it('computes severity percentages along a flat path', () => {
    const grid = makeGrid([
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
    ])
    const path: PathNode[] = [
      { x: 1, y: 2 },
      { x: 2, y: 2 },
      { x: 3, y: 2 },
    ]
    const result = computeRouteExposure(path, grid, standard)
    expect(result.segments.length).toBe(3)
    expect(result.severityPercent.low).toBeCloseTo(100, 1)
    expect(result.severityPercent.critical).toBe(0)
  })

  it('maps path nodes through their own (coarser) grid extent for distance', () => {
    // Full-resolution grid, but the path was computed on a 3x3 cost grid sharing the bbox.
    // The path crosses the full width; the distance must reflect the geographic bbox, not be
    // compressed by the full-resolution cell count.
    const grid = makeGrid([
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
    ])
    const path: PathNode[] = [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ]
    const result = computeRouteExposure(path, grid, standard, undefined, undefined, {
      width: 3,
      height: 3,
      bbox: grid.bbox,
    })
    // Two segments spanning the full bbox width (0.001° ≈ 59 m at the equator on Mars).
    expect(result.totalDistanceM).toBeGreaterThan(50)
    expect(result.totalDistanceM).toBeLessThan(70)
    expect(result.segments[2].latLon.lon).toBeCloseTo(grid.bbox.east, 6)
    // The end nodes land on the full-resolution raster boundary, which is honestly reported
    // as unknown (never treated as safe); interior segments are low.
    expect(result.severityPercent.low + result.severityPercent.unknown).toBeCloseTo(100, 1)
  })
})
