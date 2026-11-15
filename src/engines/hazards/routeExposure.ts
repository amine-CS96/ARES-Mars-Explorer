import type { PathNode } from '@/engines/pathfinding/astar'
import type { TerrainGrid, TerrainGridBBox } from '@/engines/terrain/terrainGrid'
import { gridIndexToLatLon, latLonToGridIndex } from '@/engines/terrain/terrainGrid'
import { haversineDistanceKm } from '@/utils/geo'
import { analyzeTerrain, type TerrainAnalysis } from './terrainAnalysis'
import type { HazardCluster } from './hazardDetection'
import { assessCellRisk, type MobilityProfile, type Severity } from './riskModel'

/**
 * Compute terrain hazard exposure along a planned route.
 *
 * This is used by the Hazards module to inspect a route imported from the Planner. It reuses the
 * same terrain grid and mobility profile so that metrics are consistent.
 */

export interface RouteExposureSegment {
  /** Index into the route path. */
  index: number
  /** Grid coordinates. */
  node: PathNode
  /** Geographic coordinates. */
  latLon: { lat: number; lon: number }
  /** Cumulative distance along the route from the start, in meters. */
  distanceM: number
  /** Elevation at this cell, meters. */
  elevationM: number
  /** Slope at this cell, degrees. */
  slopeDeg: number
  /** Risk severity at this cell. */
  severity: Severity
  /** Risk score at this cell (0–1). */
  score: number
}

export interface RouteExposureResult {
  /** Per-cell exposure along the path. */
  segments: RouteExposureSegment[]
  /** Total route distance in meters. */
  totalDistanceM: number
  /** Maximum slope encountered, degrees. */
  maxSlopeDeg: number
  /** Mean slope along the route, degrees. */
  meanSlopeDeg: number
  /** Percentage of route length in each severity class. */
  severityPercent: Record<Severity, number>
  /** Number of segments intersecting identified hazard clusters. */
  clusterIntersections: number
  /** IDs of hazard clusters touched by the route. */
  clusterIds: number[]
  /** Distance-weighted risk score along the route. */
  weightedRiskScore: number
}

/** Extent of the grid the path node indices refer to (the planner's cost grid). */
export interface PathGridExtent {
  width: number
  height: number
  /** Must match the terrain grid bbox so geographic conversion stays consistent. */
  bbox: TerrainGridBBox
}

/**
 * Build a TerrainAnalysis from the same TerrainGrid the Planner uses. The analysis is cached in
 * the caller via useMemo.
 */
export function analyzeRouteTerrain(
  terrainGrid: TerrainGrid,
  windowRadius?: number,
): TerrainAnalysis {
  return analyzeTerrain(terrainGrid, { windowRadius })
}

/**
 * Compute hazard exposure for a route path.
 *
 * The path nodes index `pathGrid` — the cost grid the route was computed on (default: the
 * planner's 256-cell grid when passed, or the full-resolution grid for legacy callers). Its bbox
 * matches the terrain grid, so each node maps to a geographic point through `pathGrid` and is
 * then sampled on the full-resolution analysis. Pass `precomputedAnalysis`
 * (from `analyzeRouteTerrain`/`analyzeTerrain` on the same grid) to avoid re-running the
 * ~600k-cell terrain analysis when the caller already has it.
 */
export function computeRouteExposure(
  path: PathNode[],
  terrainGrid: TerrainGrid,
  profile: MobilityProfile,
  clusters?: HazardCluster[],
  precomputedAnalysis?: TerrainAnalysis,
  pathGrid?: PathGridExtent,
): RouteExposureResult {
  const analysis = precomputedAnalysis ?? analyzeRouteTerrain(terrainGrid)
  const pathExtent = pathGrid ?? {
    width: analysis.width,
    height: analysis.height,
    bbox: analysis.bbox,
  }
  const { width, elevation, slope, roughness, relief, valid } = analysis

  const segments: RouteExposureSegment[] = []
  const severityPercent: Record<Severity, number> = {
    low: 0,
    moderate: 0,
    high: 0,
    critical: 0,
    unknown: 0,
  }

  let totalDistanceM = 0
  let maxSlope = 0
  let sumSlope = 0
  let weightedRiskSum = 0
  let prev: { lat: number; lon: number } | null = null

  const clusterIds = new Set<number>()
  const touched = new Set<string>()

  for (let i = 0; i < path.length; i++) {
    const node = path[i]
    const latLon = gridIndexToLatLon(pathExtent, node.x, node.y)
    // Sample the full-resolution analysis at the node's geographic position.
    const sampleIdx = latLonToGridIndex(analysis, latLon)
    const idx = sampleIdx ? sampleIdx.y * width + sampleIdx.x : -1

    if (prev) {
      totalDistanceM += haversineDistanceKm(prev, latLon) * 1000
    }
    prev = latLon

    const s = idx >= 0 ? slope[idx] : Number.NaN
    const r = assessCellRisk(
      s,
      idx >= 0 ? roughness[idx] : Number.NaN,
      idx >= 0 ? relief[idx] : Number.NaN,
      idx >= 0 && valid[idx] === 1,
      profile,
    )

    if (Number.isFinite(s) && s > maxSlope) maxSlope = s
    sumSlope += Number.isFinite(s) ? s : 0
    weightedRiskSum += r.score

    // Mark which clusters this segment intersects.
    if (clusters) {
      for (const cluster of clusters) {
        if (
          latLon.lon >= cluster.bbox.west &&
          latLon.lon <= cluster.bbox.east &&
          latLon.lat >= cluster.bbox.south &&
          latLon.lat <= cluster.bbox.north
        ) {
          const key = `${cluster.id}|${node.x},${node.y}`
          if (!touched.has(key)) {
            touched.add(key)
            clusterIds.add(cluster.id)
          }
        }
      }
    }

    segments.push({
      index: i,
      node,
      latLon,
      distanceM: totalDistanceM,
      elevationM: idx >= 0 ? elevation[idx] : Number.NaN,
      slopeDeg: s,
      severity: r.severity,
      score: r.score,
    })
  }

  const segmentDistance = path.length > 1 ? totalDistanceM / (path.length - 1) : 0
  for (let i = 0; i < segments.length; i++) {
    // The first segment is the start point and contributes no traversed distance.
    if (i === 0) continue
    severityPercent[segments[i].severity] += segmentDistance
  }
  for (const key of Object.keys(severityPercent) as Severity[]) {
    severityPercent[key] = totalDistanceM > 0 ? (severityPercent[key] / totalDistanceM) * 100 : 0
  }

  return {
    segments,
    totalDistanceM,
    maxSlopeDeg: maxSlope,
    meanSlopeDeg: segments.length > 0 ? sumSlope / segments.length : 0,
    severityPercent,
    clusterIntersections: touched.size,
    clusterIds: Array.from(clusterIds).sort((a, b) => a - b),
    weightedRiskScore: segments.length > 0 ? weightedRiskSum / segments.length : 0,
  }
}

/**
 * Convert a lat/lon route point to the full-resolution TerrainGrid index.
 * Returns null if outside the DEM coverage.
 */
export function routePointToGridNode(
  terrainGrid: TerrainGrid,
  point: { lat: number; lon: number },
): PathNode | null {
  const idx = latLonToGridIndex(terrainGrid, point)
  if (!idx) return null
  return { x: idx.x, y: idx.y }
}
