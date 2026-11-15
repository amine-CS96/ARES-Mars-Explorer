import type { MapOverlay } from '@/features/mars-explorer'
import type { TerrainAnalysis } from '@/engines/hazards/terrainAnalysis'
import type { HazardDetectionResult } from '@/engines/hazards/hazardDetection'
import {
  SEVERITY_COLORS,
  CATEGORY_COLORS,
  SEVERITY_ORDER,
  type HazardCategory,
  type Severity,
} from '@/engines/hazards/riskModel'
import { SLOPE_CLASS_COLORS } from '@/engines/terrain/slopeClass'

/**
 * Canvas builders for Hazards visualization layers.
 *
 * Each function produces a geographic overlay scaled to the DEM bbox. The map component draws it
 * over the base imagery. All values are derived from the actual terrain analysis.
 */

export type HazardOverlayMode =
  | 'slope'
  | 'roughness'
  | 'relief'
  | 'aspect'
  | 'risk'
  | 'clusters'
  | 'none'

function hexToRgba(hex: string, alpha: number): string {
  const r = Number.parseInt(hex.slice(1, 3), 16)
  const g = Number.parseInt(hex.slice(3, 5), 16)
  const b = Number.parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function createCanvas(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D unavailable')
  return { canvas, ctx }
}

export function buildSlopeOverlay(analysis: TerrainAnalysis): MapOverlay {
  const { canvas, ctx } = createCanvas(analysis.width, analysis.height)
  const imageData = ctx.createImageData(analysis.width, analysis.height)
  const data = imageData.data

  for (let i = 0; i < analysis.slope.length; i++) {
    const slopeDeg = analysis.slope[i]
    const valid = analysis.valid[i]
    let hex = SLOPE_CLASS_COLORS.flat
    if (valid && Number.isFinite(slopeDeg)) {
      if (slopeDeg >= 25) hex = SLOPE_CLASS_COLORS.hazardous
      else if (slopeDeg >= 15) hex = SLOPE_CLASS_COLORS.steep
      else if (slopeDeg >= 5) hex = SLOPE_CLASS_COLORS.moderate
    }
    const r = Number.parseInt(hex.slice(1, 3), 16)
    const g = Number.parseInt(hex.slice(3, 5), 16)
    const b = Number.parseInt(hex.slice(5, 7), 16)
    const idx = i * 4
    data[idx] = r
    data[idx + 1] = g
    data[idx + 2] = b
    data[idx + 3] = valid ? 140 : 0
  }

  ctx.putImageData(imageData, 0, 0)
  return { canvas, bbox: analysis.bbox, opacity: 0.75 }
}

export function buildRoughnessOverlay(analysis: TerrainAnalysis): MapOverlay {
  const { canvas, ctx } = createCanvas(analysis.width, analysis.height)
  const imageData = ctx.createImageData(analysis.width, analysis.height)
  const data = imageData.data

  // Classify roughness into 4 bins with a purple ramp.
  const colors = ['#1e1b2e', '#4c3a78', '#8b5cf6', '#d8b4fe']
  for (let i = 0; i < analysis.roughness.length; i++) {
    const valid = analysis.valid[i]
    const rough = analysis.roughness[i]
    let hex = colors[0]
    if (valid && Number.isFinite(rough)) {
      if (rough >= 8) hex = colors[3]
      else if (rough >= 5) hex = colors[2]
      else if (rough >= 3) hex = colors[1]
    }
    const r = Number.parseInt(hex.slice(1, 3), 16)
    const g = Number.parseInt(hex.slice(3, 5), 16)
    const b = Number.parseInt(hex.slice(5, 7), 16)
    const idx = i * 4
    data[idx] = r
    data[idx + 1] = g
    data[idx + 2] = b
    data[idx + 3] = valid ? 150 : 0
  }

  ctx.putImageData(imageData, 0, 0)
  return { canvas, bbox: analysis.bbox, opacity: 0.75 }
}

export function buildReliefOverlay(analysis: TerrainAnalysis): MapOverlay {
  const { canvas, ctx } = createCanvas(analysis.width, analysis.height)
  const imageData = ctx.createImageData(analysis.width, analysis.height)
  const data = imageData.data

  const colors = ['#0f172a', '#075985', '#0ea5e9', '#7dd3fc']
  for (let i = 0; i < analysis.relief.length; i++) {
    const valid = analysis.valid[i]
    const rel = analysis.relief[i]
    let hex = colors[0]
    if (valid && Number.isFinite(rel)) {
      if (rel >= 40) hex = colors[3]
      else if (rel >= 25) hex = colors[2]
      else if (rel >= 15) hex = colors[1]
    }
    const r = Number.parseInt(hex.slice(1, 3), 16)
    const g = Number.parseInt(hex.slice(3, 5), 16)
    const b = Number.parseInt(hex.slice(5, 7), 16)
    const idx = i * 4
    data[idx] = r
    data[idx + 1] = g
    data[idx + 2] = b
    data[idx + 3] = valid ? 150 : 0
  }

  ctx.putImageData(imageData, 0, 0)
  return { canvas, bbox: analysis.bbox, opacity: 0.75 }
}

export function buildAspectOverlay(analysis: TerrainAnalysis): MapOverlay {
  const { canvas, ctx } = createCanvas(analysis.width, analysis.height)
  const imageData = ctx.createImageData(analysis.width, analysis.height)
  const data = imageData.data

  for (let i = 0; i < analysis.aspect.length; i++) {
    const valid = analysis.valid[i]
    const aspect = analysis.aspect[i]
    let hue = 0
    if (valid && Number.isFinite(aspect) && aspect >= 0) {
      hue = aspect // HSL hue 0–360 matches azimuth nicely
    }
    const idx = i * 4
    // Use HSL via canvas fill would be slow; approximate with HSL string per pixel is too slow.
    // Instead, precompute a simple RGB from hue.
    const rgb = hslToRgb(hue / 360, 0.7, 0.5)
    data[idx] = rgb[0]
    data[idx + 1] = rgb[1]
    data[idx + 2] = rgb[2]
    data[idx + 3] = valid && aspect >= 0 ? 120 : 0
  }

  ctx.putImageData(imageData, 0, 0)
  return { canvas, bbox: analysis.bbox, opacity: 0.65 }
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r: number, g: number, b: number
  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}

export function buildRiskOverlay(result: HazardDetectionResult, analysis: TerrainAnalysis): MapOverlay {
  const { canvas, ctx } = createCanvas(analysis.width, analysis.height)
  const imageData = ctx.createImageData(analysis.width, analysis.height)
  const data = imageData.data

  // Severity-weighted alpha: higher-severity terrain stands out over the base imagery while
  // low-risk areas stay translucent, so the underlying hillshade/imagery remains visible.
  const alphaBySeverity: Record<Severity, number> = {
    low: 60,
    moderate: 110,
    high: 165,
    critical: 215,
    unknown: 0,
  }

  for (let i = 0; i < result.risk.length; i++) {
    const r = result.risk[i]
    const hex = SEVERITY_COLORS[r.severity]
    const rgb = Number.parseInt(hex.slice(1, 3), 16)
    const g = Number.parseInt(hex.slice(3, 5), 16)
    const b = Number.parseInt(hex.slice(5, 7), 16)
    const idx = i * 4
    data[idx] = rgb
    data[idx + 1] = g
    data[idx + 2] = b
    data[idx + 3] = alphaBySeverity[r.severity]
  }

  ctx.putImageData(imageData, 0, 0)
  return { canvas, bbox: analysis.bbox, opacity: 0.85 }
}

/**
 * Build an overlay that outlines hazard clusters. Each cluster is drawn as a transparent fill with
 * a colored stroke matching its dominant category.
 */
export function buildClusterOverlay(
  result: HazardDetectionResult,
  analysis: TerrainAnalysis,
  selectedClusterId?: number | null,
): MapOverlay {
  const { canvas, ctx } = createCanvas(analysis.width, analysis.height)
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Draw all cluster bounding boxes as semi-transparent fills.
  for (const cluster of result.clusters) {
    const color = CATEGORY_COLORS[cluster.category]
    const isSelected = cluster.id === selectedClusterId
    ctx.fillStyle = hexToRgba(color, isSelected ? 0.25 : 0.08)
    ctx.strokeStyle = hexToRgba(color, isSelected ? 0.95 : 0.6)
    ctx.lineWidth = isSelected ? 2 : 1

    const westX = ((cluster.bbox.west - analysis.bbox.west) / (analysis.bbox.east - analysis.bbox.west)) * canvas.width
    const eastX = ((cluster.bbox.east - analysis.bbox.west) / (analysis.bbox.east - analysis.bbox.west)) * canvas.width
    const northY = ((analysis.bbox.north - cluster.bbox.north) / (analysis.bbox.north - analysis.bbox.south)) * canvas.height
    const southY = ((analysis.bbox.north - cluster.bbox.south) / (analysis.bbox.north - analysis.bbox.south)) * canvas.height

    ctx.strokeRect(westX, northY, eastX - westX, southY - northY)
    ctx.fillRect(westX, northY, eastX - westX, southY - northY)

    // Label the selected cluster.
    if (isSelected) {
      ctx.fillStyle = '#f5f7fa'
      ctx.font = '10px JetBrains Mono, monospace'
      ctx.fillText(`H${cluster.id}`, westX + 3, northY + 12)
    }
  }

  return { canvas, bbox: analysis.bbox, opacity: 0.9 }
}

export const OVERLAY_MODES: {
  id: HazardOverlayMode
  label: string
  description: string
  unit: string
  method: string
  legend: Array<{ label: string; color: string }>
}[] = [
  {
    id: 'slope',
    label: 'Slope',
    description: 'Slope classes derived from the DEM by Horn finite differences.',
    unit: 'degrees',
    method: 'Horn 3×3 finite differences on the 20 m elevation grid.',
    legend: [
      { label: '< 5° flat', color: SLOPE_CLASS_COLORS.flat },
      { label: '5–15° moderate', color: SLOPE_CLASS_COLORS.moderate },
      { label: '15–25° steep', color: SLOPE_CLASS_COLORS.steep },
      { label: '> 25° hazardous', color: SLOPE_CLASS_COLORS.hazardous },
    ],
  },
  {
    id: 'roughness',
    label: 'Roughness',
    description: 'Local elevation standard deviation in a 5×5 window.',
    unit: 'meters (σz)',
    method: 'Standard deviation of elevation in a 5×5 (~100 m) moving window.',
    legend: [
      { label: '< 3 m low', color: '#1e1b2e' },
      { label: '3–5 m moderate', color: '#4c3a78' },
      { label: '5–8 m high', color: '#8b5cf6' },
      { label: '> 8 m very high', color: '#d8b4fe' },
    ],
  },
  {
    id: 'relief',
    label: 'Local relief',
    description: 'Max − min elevation in a 5×5 window.',
    unit: 'meters',
    method: 'Maximum minus minimum elevation in a 5×5 (~100 m) moving window.',
    legend: [
      { label: '< 15 m low', color: '#0f172a' },
      { label: '15–25 m moderate', color: '#075985' },
      { label: '25–40 m high', color: '#0ea5e9' },
      { label: '> 40 m very high', color: '#7dd3fc' },
    ],
  },
  {
    id: 'aspect',
    label: 'Aspect',
    description: 'Direction of steepest descent, clockwise from north.',
    unit: 'degrees from N',
    method: 'Gradient direction from Horn finite differences; −1 on flat cells.',
    legend: [
      { label: 'N', color: '#ff6b6b' },
      { label: 'E', color: '#51cf66' },
      { label: 'S', color: '#339af0' },
      { label: 'W', color: '#fcc419' },
    ],
  },
  {
    id: 'risk',
    label: 'Combined risk',
    description: 'Weighted slope + roughness + relief score for the active mobility profile.',
    unit: 'risk score 0–1',
    method: 'Weighted ramp of slope, roughness, and relief against the active profile thresholds.',
    legend: SEVERITY_ORDER.map((s) => ({
      label: s.charAt(0).toUpperCase() + s.slice(1),
      color: SEVERITY_COLORS[s],
    })),
  },
  {
    id: 'clusters',
    label: 'Hazard clusters',
    description: 'Connected regions of moderate-or-higher risk, outlined by dominant category.',
    unit: 'regions',
    method: '8-connected components of moderate+ cells, minimum reported area filter applied.',
    legend: (Object.keys(CATEGORY_COLORS) as HazardCategory[])
      .filter((c) => c !== 'none')
      .map((c) => ({ label: c.replace(/_/g, ' '), color: CATEGORY_COLORS[c] })),
  },
]
