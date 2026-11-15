import type { TerrainAnalysis } from './terrainAnalysis'
import {
  assessCellRisk,
  type CellRisk,
  type HazardCategory,
  type MobilityProfile,
  type Severity,
} from './riskModel'
import { gridIndexToLatLon, type TerrainGridBBox } from '@/engines/terrain/terrainGrid'

/**
 * Dynamic hazard identification from the derived terrain analysis.
 *
 * Connected-component analysis groups neighboring hazardous cells into spatial clusters. Each
 * cluster receives statistics, a dominant category, and a severity ranking. This avoids displaying
 * every hazardous pixel as an independent hazard.
 */

export interface HazardCluster {
  /** Stable numeric ID (order of discovery). */
  id: number
  /** Dominant hazard category among member cells. */
  category: HazardCategory
  /** Maximum severity among member cells. */
  severity: Severity
  /** Number of cells in the cluster. */
  cellCount: number
  /** Approximate area in square meters. */
  areaSqM: number
  /** Geographic centroid. */
  centroid: { lat: number; lon: number }
  /** Geographic bounding box. */
  bbox: TerrainGridBBox
  /** Terrain statistics aggregated over member cells. */
  stats: {
    maxSlopeDeg: number
    meanSlopeDeg: number
    maxRoughnessM: number
    meanRoughnessM: number
    maxReliefM: number
    meanReliefM: number
    meanElevationM: number
    minElevationM: number
    maxElevationM: number
  }
  /** Risk score of the worst cell. */
  maxScore: number
  /** Mean risk score across the cluster. */
  meanScore: number
  /** Count of cells by severity. */
  severityCounts: Record<Severity, number>
}

export interface HazardDetectionOptions {
  /** Minimum area (m²) for a cluster to be reported. Default 50,000 m². */
  minClusterAreaSqM?: number
}

export interface HazardDetectionResult {
  /** Per-cell risk assessment, row-major. */
  risk: CellRisk[]
  /** Clusters of cells with moderate or higher risk. */
  clusters: HazardCluster[]
  /** Count of cells by severity across the whole grid. */
  severityCounts: Record<Severity, number>
  /** Count of cells by category across the whole grid. */
  categoryCounts: Record<HazardCategory, number>
  /** Number of valid cells analyzed. */
  validCellCount: number
  /** Number of nodata cells. */
  nodataCellCount: number
}

const NEIGHBORS_8: Array<[number, number]> = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
]

/** Minimum area for a cluster to be reported (m²). Filters tiny noise fragments. */
const MIN_CLUSTER_AREA_SQ_M = 50_000

function severityRank(severity: Severity): number {
  switch (severity) {
    case 'low':
      return 0
    case 'moderate':
      return 1
    case 'high':
      return 2
    case 'critical':
      return 3
    case 'unknown':
      return -1
  }
}

/**
 * Run the complete hazard detection pipeline:
 * 1. Assess every cell against the mobility profile.
 * 2. Group moderate+ cells into 4-connected clusters.
 * 3. Compute cluster statistics.
 */
export function detectHazards(
  analysis: TerrainAnalysis,
  profile: MobilityProfile,
  options: HazardDetectionOptions = {},
): HazardDetectionResult {
  const minClusterAreaSqM = options.minClusterAreaSqM ?? MIN_CLUSTER_AREA_SQ_M
  const { width, height, valid } = analysis
  const totalCells = width * height
  const risk: CellRisk[] = new Array(totalCells)
  const severityCounts: Record<Severity, number> = {
    low: 0,
    moderate: 0,
    high: 0,
    critical: 0,
    unknown: 0,
  }
  const categoryCounts: Record<HazardCategory, number> = {
    steep_slope: 0,
    very_steep: 0,
    high_roughness: 0,
    high_relief: 0,
    uncertain_data: 0,
    none: 0,
  }

  let validCellCount = 0
  let nodataCellCount = 0

  for (let i = 0; i < totalCells; i++) {
    const v = valid[i]
    const r = assessCellRisk(
      analysis.slope[i],
      analysis.roughness[i],
      analysis.relief[i],
      v === 1,
      profile,
    )
    risk[i] = r
    severityCounts[r.severity]++
    categoryCounts[r.category]++
    if (v === 1) validCellCount++
    else nodataCellCount++
  }

  const clusters = extractClusters(analysis, risk, minClusterAreaSqM)

  return {
    risk,
    clusters,
    severityCounts,
    categoryCounts,
    validCellCount,
    nodataCellCount,
  }
}

function extractClusters(
  analysis: TerrainAnalysis,
  risk: CellRisk[],
  minClusterAreaSqM: number,
): HazardCluster[] {
  const { width, height } = analysis
  const visited = new Uint8Array(width * height)
  const clusters: HazardCluster[] = []
  let clusterId = 1

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      if (visited[idx]) continue
      const r = risk[idx]
      if (severityRank(r.severity) < 1) {
        visited[idx] = 1
        continue
      }

      // Flood-fill a 4-connected cluster of moderate+ cells.
      const queue: Array<{ x: number; y: number }> = [{ x, y }]
      visited[idx] = 1
      const members: Array<{ x: number; y: number; idx: number }> = []

      while (queue.length > 0) {
        const current = queue.shift()!
        const cIdx = current.y * width + current.x
        members.push({ x: current.x, y: current.y, idx: cIdx })

        for (const [dx, dy] of NEIGHBORS_8) {
          const nx = current.x + dx
          const ny = current.y + dy
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue
          const nIdx = ny * width + nx
          if (visited[nIdx]) continue
          if (severityRank(risk[nIdx].severity) < 1) {
            visited[nIdx] = 1
            continue
          }
          visited[nIdx] = 1
          queue.push({ x: nx, y: ny })
        }
      }

      if (members.length === 0) continue

      const cluster = buildCluster(clusterId++, members, analysis, risk)
      if (cluster.areaSqM >= minClusterAreaSqM) {
        clusters.push(cluster)
      }
    }
  }

  // Sort by severity descending, then by area descending.
  clusters.sort((a, b) => {
    const rankDiff = severityRank(b.severity) - severityRank(a.severity)
    if (rankDiff !== 0) return rankDiff
    return b.areaSqM - a.areaSqM
  })

  return clusters
}

function buildCluster(
  id: number,
  members: Array<{ x: number; y: number; idx: number }>,
  analysis: TerrainAnalysis,
  risk: CellRisk[],
): HazardCluster {
  const { elevation, slope, roughness, relief } = analysis
  const cellArea = analysis.metersPerPixel * analysis.metersPerPixel

  let minX = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY
  let sumX = 0
  let sumY = 0

  let maxSlope = Number.NEGATIVE_INFINITY
  let sumSlope = 0
  let maxRoughness = Number.NEGATIVE_INFINITY
  let sumRoughness = 0
  let maxRelief = Number.NEGATIVE_INFINITY
  let sumRelief = 0
  let sumElevation = 0
  let minElevation = Number.POSITIVE_INFINITY
  let maxElevation = Number.NEGATIVE_INFINITY
  let maxScore = 0
  let sumScore = 0

  const severityCounts: Record<Severity, number> = {
    low: 0,
    moderate: 0,
    high: 0,
    critical: 0,
    unknown: 0,
  }
  const categoryCounts: Record<HazardCategory, number> = {
    steep_slope: 0,
    very_steep: 0,
    high_roughness: 0,
    high_relief: 0,
    uncertain_data: 0,
    none: 0,
  }

  for (const m of members) {
    const idx = m.idx
    minX = Math.min(minX, m.x)
    maxX = Math.max(maxX, m.x)
    maxY = Math.max(maxY, m.y)
    minY = Math.min(minY, m.y)
    sumX += m.x
    sumY += m.y

    const s = slope[idx]
    const rou = roughness[idx]
    const rel = relief[idx]
    const elev = elevation[idx]
    const r = risk[idx]

    if (s > maxSlope) maxSlope = s
    sumSlope += s
    if (rou > maxRoughness) maxRoughness = rou
    sumRoughness += rou
    if (rel > maxRelief) maxRelief = rel
    sumRelief += rel

    sumElevation += elev
    if (elev < minElevation) minElevation = elev
    if (elev > maxElevation) maxElevation = elev

    if (r.score > maxScore) maxScore = r.score
    sumScore += r.score
    severityCounts[r.severity]++
    categoryCounts[r.category]++
  }

  const count = members.length
  const dominantCategory = (Object.keys(categoryCounts) as HazardCategory[]).reduce((a, b) =>
    categoryCounts[a] > categoryCounts[b] ? a : b,
  )
  const worstSeverity = (Object.keys(severityCounts) as Severity[]).reduce((a, b) =>
    severityRank(a) > severityRank(b) ? a : b,
  )

  const centroidGrid = { x: sumX / count, y: sumY / count }
  const centroid = gridIndexToLatLon(analysis, Math.round(centroidGrid.x), Math.round(centroidGrid.y))

  const nw = gridIndexToLatLon(analysis, minX, minY)
  const se = gridIndexToLatLon(analysis, maxX, maxY)

  return {
    id,
    category: dominantCategory,
    severity: worstSeverity,
    cellCount: count,
    areaSqM: count * cellArea,
    centroid,
    bbox: {
      west: nw.lon,
      south: se.lat,
      east: se.lon,
      north: nw.lat,
    },
    stats: {
      maxSlopeDeg: maxSlope,
      meanSlopeDeg: sumSlope / count,
      maxRoughnessM: maxRoughness,
      meanRoughnessM: sumRoughness / count,
      maxReliefM: maxRelief,
      meanReliefM: sumRelief / count,
      meanElevationM: sumElevation / count,
      minElevationM: minElevation,
      maxElevationM: maxElevation,
    },
    maxScore,
    meanScore: sumScore / count,
    severityCounts,
  }
}
