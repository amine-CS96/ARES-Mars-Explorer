import { describe, expect, it } from 'vitest'
import { buildCostGrid } from '@/engines/terrain/costGrid'
import type { TerrainGrid } from '@/engines/terrain/terrainGrid'
import { defaultCostParams } from './costModel'
import { findPath } from './astar'

function makeFlatGrid(width: number, height: number): TerrainGrid {
  return {
    width,
    height,
    bbox: { west: 0, south: 0, east: 1, north: 1 },
    elevation: new Float32Array(width * height).fill(0),
    slope: new Float32Array(width * height).fill(0),
    minElevation: 0,
    maxElevation: 0,
    metersPerPixel: 10,
  }
}

function gridWithRidge(width: number, height: number): TerrainGrid {
  const elevation = new Float32Array(width * height)
  const ridgeX = Math.floor(width / 2)
  const ridgeHeight = 4 // meters — steep enough to forbid direct crossing at 15° but not block adjacent cells
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // A ridge along the center column with a gap at the top so a detour exists.
      elevation[y * width + x] = x === ridgeX && y < height - 4 ? ridgeHeight : 0
    }
  }
  return {
    width,
    height,
    bbox: { west: 0, south: 0, east: 1, north: 1 },
    elevation,
    slope: new Float32Array(width * height).fill(0),
    minElevation: 0,
    maxElevation: ridgeHeight,
    metersPerPixel: 10,
  }
}

describe('findPath', () => {
  it('finds a straight path on flat terrain', () => {
    const grid = buildCostGrid(makeFlatGrid(32, 32), { maxCells: 16 })
    const result = findPath(grid, { x: 2, y: 2 }, { x: 10, y: 2 }, {
      costParams: defaultCostParams(),
    })
    expect(result.reachable).toBe(true)
    expect(result.path.length).toBeGreaterThanOrEqual(8)
    expect(result.path[0]).toEqual({ x: 2, y: 2 })
    expect(result.path[result.path.length - 1]).toEqual({ x: 10, y: 2 })
  })

  it('avoids a steep ridge by detouring', () => {
    const grid = buildCostGrid(gridWithRidge(16, 16), { maxCells: 16 })
    const result = findPath(grid, { x: 2, y: 8 }, { x: 14, y: 8 }, {
      costParams: defaultCostParams(),
      maxSlopeDeg: 15,
    })
    expect(result.reachable).toBe(true)
    // Path should not be a straight line because the center ridge is too steep.
    const straightLineLength = Math.abs(14 - 2)
    expect(result.path.length).toBeGreaterThan(straightLineLength)
  })

  it('returns unreachable when start or goal is outside the grid', () => {
    const grid = buildCostGrid(makeFlatGrid(8, 8), { maxCells: 8 })
    const result = findPath(grid, { x: -1, y: 0 }, { x: 4, y: 4 }, {
      costParams: defaultCostParams(),
    })
    expect(result.reachable).toBe(false)
  })

  it('forbids edges steeper than maxSlopeDeg', () => {
    const elevation = new Float32Array(16 * 16)
    for (let x = 0; x < 16; x++) elevation[8 * 16 + x] = x < 8 ? 0 : 50
    const terrain: TerrainGrid = {
      width: 16,
      height: 16,
      bbox: { west: 0, south: 0, east: 1, north: 1 },
      elevation,
      slope: new Float32Array(16 * 16).fill(0),
      minElevation: 0,
      maxElevation: 50,
      metersPerPixel: 10,
    }
    const grid = buildCostGrid(terrain, { maxCells: 16 })
    const result = findPath(grid, { x: 0, y: 8 }, { x: 15, y: 8 }, {
      costParams: defaultCostParams(),
      maxSlopeDeg: 5,
    })
    // With a 5° limit the abrupt cliff is impassable on a 16×16 grid.
    expect(result.reachable).toBe(false)
  })
})
