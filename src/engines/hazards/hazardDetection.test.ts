import { describe, expect, it } from 'vitest'
import { detectHazards } from './hazardDetection'
import { analyzeTerrain } from './terrainAnalysis'
import { getProfileById } from './riskModel'
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

describe('detectHazards', () => {
  const standard = getProfileById('standard')

  it('finds no clusters in a flat grid', () => {
    const grid = makeGrid([
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
    ])
    const analysis = analyzeTerrain(grid)
    const result = detectHazards(analysis, standard, { minClusterAreaSqM: 0 })
    expect(result.clusters.length).toBe(0)
    expect(result.severityCounts.critical).toBe(0)
    expect(result.severityCounts.high).toBe(0)
    expect(result.severityCounts.moderate).toBe(0)
  })

  it('groups connected steep cells into one cluster', () => {
    // A 3×3 block in the center raised 40 m above a flat plain creates steep edges.
    const plain = 0
    const high = 40
    const grid = makeGrid([
      [plain, plain, plain, plain, plain, plain, plain],
      [plain, plain, plain, plain, plain, plain, plain],
      [plain, plain, high, high, high, plain, plain],
      [plain, plain, high, high, high, plain, plain],
      [plain, plain, high, high, high, plain, plain],
      [plain, plain, plain, plain, plain, plain, plain],
      [plain, plain, plain, plain, plain, plain, plain],
    ])
    const analysis = analyzeTerrain(grid)
    const result = detectHazards(analysis, standard, { minClusterAreaSqM: 0 })
    // At least one cluster should exist around the steep edge.
    expect(result.clusters.length).toBeGreaterThanOrEqual(1)
  })

  it('produces separate clusters for disconnected steep regions', () => {
    const plain = 0
    const high = 40
    const grid = makeGrid([
      [plain, plain, plain, plain, plain, plain, plain, plain, plain],
      [plain, high, high, plain, plain, plain, high, high, plain],
      [plain, high, high, plain, plain, plain, high, high, plain],
      [plain, high, high, plain, plain, plain, high, high, plain],
      [plain, plain, plain, plain, plain, plain, plain, plain, plain],
    ])
    const analysis = analyzeTerrain(grid, { windowRadius: 1 })
    const result = detectHazards(analysis, standard, { minClusterAreaSqM: 0 })
    expect(result.clusters.length).toBeGreaterThanOrEqual(2)
  })

  it('computes cluster statistics', () => {
    const grid = makeGrid([
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 40, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ])
    const analysis = analyzeTerrain(grid)
    const result = detectHazards(analysis, standard, { minClusterAreaSqM: 0 })
    expect(result.clusters.length).toBeGreaterThanOrEqual(1)
    const cluster = result.clusters[0]
    expect(cluster.stats.maxReliefM).toBeGreaterThan(0)
    expect(cluster.areaSqM).toBeGreaterThan(0)
    expect(cluster.centroid.lat).toBeGreaterThan(0)
    expect(cluster.centroid.lon).toBeGreaterThan(0)
  })

  it('counts unknown cells for invalid elevation', () => {
    const grid = makeGrid([
      [1, 1, 1],
      [1, Number.NaN, 1],
      [1, 1, 1],
    ])
    const analysis = analyzeTerrain(grid)
    const result = detectHazards(analysis, standard, { minClusterAreaSqM: 0 })
    expect(result.nodataCellCount).toBeGreaterThan(0)
    expect(result.severityCounts.unknown).toBeGreaterThan(0)
  })
})
