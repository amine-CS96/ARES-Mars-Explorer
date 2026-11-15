import type { HazardDetectionResult, HazardCluster } from '@/engines/hazards/hazardDetection'
import type { TerrainAnalysis } from '@/engines/hazards/terrainAnalysis'
import type { RouteExposureResult } from '@/engines/hazards/routeExposure'
import type { MobilityProfile, Severity, HazardCategory } from '@/engines/hazards/riskModel'
import { SEVERITY_LABELS, CATEGORY_LABELS } from '@/engines/hazards/riskModel'

/**
 * Analysis export builders.
 *
 * Every field is written from the actual computed analysis — provenance, thresholds, cluster
 * statistics, and route exposure as measured. Nothing is invented or prettified.
 */

export interface AnalysisExportMeta {
  region: string
  demSource: string
  demResolutionM: number
  demBbox: { west: number; south: number; east: number; north: number }
  windowRadius: number
  generatedAtISO: string
}

export interface AnalysisExportInput {
  meta: AnalysisExportMeta
  profile: MobilityProfile
  detection: HazardDetectionResult
  analysis: TerrainAnalysis
  routeExposure: RouteExposureResult | null
  minClusterAreaSqM: number
}

const METHODOLOGY = [
  'Slope recomputed from elevation with Horn 3x3 finite differences (degrees).',
  'TRI: RMS of elevation differences to neighbors in the window; roughness: local standard deviation; relief: max-min, all over a square moving window.',
  'Aspect: direction of steepest descent, clockwise from north (-1 flat).',
  'Per-cell risk: weighted ramp score of slope/roughness/relief against the active mobility profile thresholds; severity bands low<0.25<=moderate<0.5<=high<0.75<=critical.',
  'Clusters: 8-connected components of moderate-or-higher cells, minimum reported area filter applied.',
  'Nodata/boundary cells are excluded from derivatives and reported as unknown — never treated as safe.',
]

const LIMITATIONS = [
  'DEM resolution is 20 m/px: individual boulders and sub-20 m obstacles are NOT resolved. Roughness is a terrain-derived metric, not rock detection.',
  'Outputs are planning estimates derived from a single CTX DTM; they are not certified traversability or flight-safety products.',
  'Mobility profiles are educational planning assumptions, not official rover or NASA specifications.',
]

function clusterRow(c: HazardCluster): Record<string, string | number> {
  return {
    hazard_id: c.id,
    severity: c.severity,
    severity_label: SEVERITY_LABELS[c.severity],
    dominant_category: c.category,
    dominant_category_label: CATEGORY_LABELS[c.category],
    area_sq_km: Number((c.areaSqM / 1_000_000).toFixed(6)),
    cells: c.cellCount,
    centroid_lat: Number(c.centroid.lat.toFixed(6)),
    centroid_lon: Number(c.centroid.lon.toFixed(6)),
    bbox_west: Number(c.bbox.west.toFixed(6)),
    bbox_south: Number(c.bbox.south.toFixed(6)),
    bbox_east: Number(c.bbox.east.toFixed(6)),
    bbox_north: Number(c.bbox.north.toFixed(6)),
    max_slope_deg: Number(c.stats.maxSlopeDeg.toFixed(2)),
    mean_slope_deg: Number(c.stats.meanSlopeDeg.toFixed(2)),
    max_roughness_m: Number(c.stats.maxRoughnessM.toFixed(2)),
    mean_roughness_m: Number(c.stats.meanRoughnessM.toFixed(2)),
    max_relief_m: Number(c.stats.maxReliefM.toFixed(2)),
    mean_relief_m: Number(c.stats.meanReliefM.toFixed(2)),
    min_elevation_m: Number(c.stats.minElevationM.toFixed(2)),
    max_elevation_m: Number(c.stats.maxElevationM.toFixed(2)),
    mean_elevation_m: Number(c.stats.meanElevationM.toFixed(2)),
    max_risk_score: Number(c.maxScore.toFixed(4)),
    mean_risk_score: Number(c.meanScore.toFixed(4)),
    critical_cells: c.severityCounts.critical,
    high_cells: c.severityCounts.high,
    moderate_cells: c.severityCounts.moderate,
    low_cells: c.severityCounts.low,
    unknown_cells: c.severityCounts.unknown,
  }
}

function csvEscape(value: string | number): string {
  const s = String(value)
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function recordsToCsv(rows: Array<Record<string, string | number>>): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const lines = [headers.join(',')]
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h] ?? '')).join(','))
  }
  return lines.join('\n')
}

function severityCountsPlain(counts: Record<Severity, number>): Record<Severity, number> {
  return {
    low: counts.low,
    moderate: counts.moderate,
    high: counts.high,
    critical: counts.critical,
    unknown: counts.unknown,
  }
}

function categoryCountsPlain(counts: Record<HazardCategory, number>): Record<HazardCategory, number> {
  return {
    steep_slope: counts.steep_slope,
    very_steep: counts.very_steep,
    high_roughness: counts.high_roughness,
    high_relief: counts.high_relief,
    uncertain_data: counts.uncertain_data,
    none: counts.none,
  }
}

/** Build the complete JSON export document from the live analysis state. */
export function buildAnalysisJson(input: AnalysisExportInput): unknown {
  const { meta, profile, detection, analysis, routeExposure, minClusterAreaSqM } = input
  const totalCells = analysis.width * analysis.height

  return {
    metadata: {
      product: 'ARES — Mars Mission Explorer · Terrain Hazard Analysis',
      generatedAt: meta.generatedAtISO,
      region: meta.region,
      dem: {
        source: meta.demSource,
        resolutionMPerPx: meta.demResolutionM,
        bbox: meta.demBbox,
        widthPx: analysis.width,
        heightPx: analysis.height,
        verticalDatum: 'MOLA areoid',
      },
      analysis: {
        windowRadiusCells: meta.windowRadius,
        windowSizeCells: meta.windowRadius * 2 + 1,
        minClusterAreaSqM,
        totalCells,
        validCells: detection.validCellCount,
        nodataCells: detection.nodataCellCount,
      },
    },
    mobilityProfile: {
      id: profile.id,
      name: profile.name,
      description: profile.description,
      thresholds: {
        slopeModerateDeg: profile.slopeModerateDeg,
        slopeSteepDeg: profile.slopeSteepDeg,
        slopeCriticalDeg: profile.slopeCriticalDeg,
        roughnessThresholdM: profile.roughnessThresholdM,
        reliefThresholdM: profile.reliefThresholdM,
        maxTraversableSlopeDeg: profile.maxTraversableSlopeDeg,
      },
      weights: profile.weights,
      note: 'Educational planning assumption, not an official rover specification.',
    },
    coverage: {
      severityCellCounts: severityCountsPlain(detection.severityCounts),
      categoryCellCounts: categoryCountsPlain(detection.categoryCounts),
    },
    clusters: detection.clusters.map(clusterRow),
    routeExposure: routeExposure
      ? {
          available: true,
          totalDistanceM: Number(routeExposure.totalDistanceM.toFixed(1)),
          maxSlopeDeg: Number(routeExposure.maxSlopeDeg.toFixed(2)),
          meanSlopeDeg: Number(routeExposure.meanSlopeDeg.toFixed(2)),
          severityPercent: {
            low: Number(routeExposure.severityPercent.low.toFixed(2)),
            moderate: Number(routeExposure.severityPercent.moderate.toFixed(2)),
            high: Number(routeExposure.severityPercent.high.toFixed(2)),
            critical: Number(routeExposure.severityPercent.critical.toFixed(2)),
            unknown: Number(routeExposure.severityPercent.unknown.toFixed(2)),
          },
          intersectedClusterIds: routeExposure.clusterIds,
          weightedRiskScore: Number(routeExposure.weightedRiskScore.toFixed(4)),
        }
      : { available: false, note: 'No route imported from the Planner for this analysis.' },
    methodology: METHODOLOGY,
    limitations: LIMITATIONS,
  }
}

/** Build a CSV table (one row per cluster) from the live detection result. */
export function buildAnalysisCsv(detection: HazardDetectionResult): string {
  return recordsToCsv(detection.clusters.map(clusterRow))
}

/** Trigger a client-side download of a text payload. */
export function downloadTextFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function timestampSlug(iso: string): string {
  return iso.replace(/[:.]/g, '-').slice(0, 19)
}
