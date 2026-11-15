import { describe, expect, it } from 'vitest'
import { buildAnalysisCsv, buildAnalysisJson, timestampSlug } from './exportAnalysis'
import { analyzeTerrain } from '@/engines/hazards/terrainAnalysis'
import { detectHazards } from '@/engines/hazards/hazardDetection'
import { getProfileById } from '@/engines/hazards/riskModel'
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

function buildFixture() {
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
  const profile = getProfileById('standard')
  const detection = detectHazards(analysis, profile, { minClusterAreaSqM: 0 })
  return { analysis, profile, detection }
}

describe('exportAnalysis', () => {
  it('builds a JSON document with provenance, thresholds, and cluster rows', () => {
    const { analysis, profile, detection } = buildFixture()
    const json = buildAnalysisJson({
      meta: {
        region: 'Jezero Crater',
        demSource: 'USGS Mars 2020 TRN CTX DTM Mosaic',
        demResolutionM: 20,
        demBbox: analysis.bbox,
        windowRadius: analysis.windowRadius,
        generatedAtISO: '2026-11-15T00:00:00.000Z',
      },
      profile,
      detection,
      analysis,
      routeExposure: null,
      minClusterAreaSqM: 0,
    }) as Record<string, unknown>

    const meta = json.metadata as Record<string, unknown>
    expect(meta.region).toBe('Jezero Crater')
    expect((json.mobilityProfile as Record<string, unknown>).weights).toEqual(profile.weights)
    expect((json.methodology as unknown[]).length).toBeGreaterThan(0)
    expect((json.limitations as unknown[]).length).toBeGreaterThan(0)

    const clusters = json.clusters as Array<Record<string, unknown>>
    expect(clusters.length).toBe(detection.clusters.length)
    for (const c of clusters) {
      expect(Number.isFinite(c.max_slope_deg)).toBe(true)
      expect(c.severity).toBeOneOf(['low', 'moderate', 'high', 'critical', 'unknown'])
    }
    expect((json.routeExposure as Record<string, unknown>).available).toBe(false)
  })

  it('includes route exposure when available', () => {
    const { analysis, profile, detection } = buildFixture()
    const routeExposure = {
      segments: [],
      totalDistanceM: 1234.5,
      maxSlopeDeg: 21,
      meanSlopeDeg: 8.4,
      severityPercent: { low: 50, moderate: 20, high: 20, critical: 10, unknown: 0 },
      clusterIntersections: 2,
      clusterIds: [1],
      weightedRiskScore: 0.2,
    }
    const json = buildAnalysisJson({
      meta: {
        region: 'Jezero Crater',
        demSource: 'test',
        demResolutionM: 20,
        demBbox: analysis.bbox,
        windowRadius: 2,
        generatedAtISO: '2026-11-15T00:00:00.000Z',
      },
      profile,
      detection,
      analysis,
      routeExposure,
      minClusterAreaSqM: 0,
    }) as Record<string, unknown>

    const route = json.routeExposure as Record<string, unknown>
    expect(route.available).toBe(true)
    expect(route.totalDistanceM).toBeCloseTo(1234.5, 1)
    expect(route.intersectedClusterIds).toEqual([1])
  })

  it('builds a CSV with one row per cluster and consistent columns', () => {
    const { detection } = buildFixture()
    const csv = buildAnalysisCsv(detection)
    const lines = csv.split('\n')
    expect(lines.length).toBe(detection.clusters.length + 1)
    const headers = lines[0].split(',')
    expect(headers).toContain('hazard_id')
    expect(headers).toContain('max_slope_deg')
    expect(headers).toContain('centroid_lat')
    for (const line of lines.slice(1)) {
      expect(line.split(',').length).toBe(headers.length)
    }
  })

  it('handles zero clusters in CSV', () => {
    const grid = makeGrid([
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
    ])
    const analysis = analyzeTerrain(grid)
    const profile = getProfileById('standard')
    const detection = detectHazards(analysis, profile, { minClusterAreaSqM: 0 })
    expect(buildAnalysisCsv(detection)).toBe('')
  })

  it('slugifies timestamps for filenames', () => {
    expect(timestampSlug('2026-11-15T07:42:45.123Z')).toBe('2026-11-15T07-42-45')
  })
})
