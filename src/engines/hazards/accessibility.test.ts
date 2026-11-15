import { describe, expect, it } from 'vitest'
import {
  computeProfileAccessibility,
  computeAllProfileAccessibility,
} from './accessibility'
import { analyzeTerrain } from './terrainAnalysis'
import { MOBILITY_PROFILES, getProfileById } from './riskModel'
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
    bbox: { west: 77.1, south: 18.2, east: 77.7, north: 18.7 },
    elevation: flat,
    slope: new Float32Array(height * width),
    minElevation: 0,
    maxElevation: 40,
    metersPerPixel: 20,
  }
}

describe('computeProfileAccessibility', () => {
  it('classifies flat terrain as fully accessible for every profile', () => {
    const grid = makeGrid(
      Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => 0)),
    )
    const analysis = analyzeTerrain(grid)
    for (const profile of MOBILITY_PROFILES) {
      const summary = computeProfileAccessibility(analysis, profile)
      expect(summary.validCells).toBeGreaterThan(0)
      expect(summary.restrictedCells).toBe(0)
      expect(summary.accessibleFraction).toBeCloseTo(1, 5)
      expect(summary.accessibleFraction + summary.restrictedFraction).toBeCloseTo(1, 5)
    }
  })

  it('restricts rugged terrain and keeps measurements independent of the profile', () => {
    const grid = makeGrid([
      [0, 0, 0, 0, 0, 0],
      [0, 0, 40, 40, 40, 0],
      [0, 0, 40, 40, 40, 0],
      [0, 0, 40, 40, 40, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
    ])
    const analysis = analyzeTerrain(grid)
    const standard = computeProfileAccessibility(analysis, getProfileById('standard'))
    const cautious = computeProfileAccessibility(analysis, getProfileById('cautious'))

    expect(standard.restrictedCells).toBeGreaterThan(0)
    expect(cautious.restrictedCells).toBeGreaterThanOrEqual(standard.restrictedCells)
    // The DEM itself never changes with the profile — only the classification does.
    expect(standard.validCells).toBe(cautious.validCells)
    expect(standard.restrictedFraction + standard.accessibleFraction).toBeCloseTo(1, 5)
  })

  it('computes all profiles in MOBILITY_PROFILES order', () => {
    const grid = makeGrid(
      Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => 5)),
    )
    const analysis = analyzeTerrain(grid)
    const all = computeAllProfileAccessibility(analysis, MOBILITY_PROFILES)
    expect(all.map((a) => a.profileId)).toEqual(MOBILITY_PROFILES.map((p) => p.id))
  })
})
