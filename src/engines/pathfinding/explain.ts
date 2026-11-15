import type { PathNode } from './astar'
import type { CostGrid } from '@/engines/terrain/costGrid'
import { gridIndexToLatLon } from '@/engines/terrain/terrainGrid'
import { haversineDistanceKm } from '@/utils/geo'

/**
 * Generate a plain-language explanation of why the recommended route was chosen and how it
 * compares to the straight-line alternative.
 *
 * All comparisons are energy/distance trade-offs computed from the real cost grid, not
 * hand-waving. The function never claims a route is "safe".
 */

export interface RouteSummary {
  path: PathNode[]
  cost: number
  distanceMeters: number
  maxSlopeDeg: number
  averageSlopeDeg: number
}

export interface StraightLineSummary {
  distanceMeters: number
  /** Number of grid cells along the straight line that are untraversable. */
  blockedCells: number
}

export interface RouteExplanation {
  primaryText: string
  comparisonText: string
  cautionText?: string
}

function pathDistanceMeters(grid: CostGrid, path: PathNode[]): number {
  let d = 0
  for (let i = 1; i < path.length; i++) {
    const dx = path[i].x - path[i - 1].x
    const dy = path[i].y - path[i - 1].y
    d += Math.sqrt(dx * dx + dy * dy) * grid.metersPerPixel
  }
  return d
}

export function summarizeRoute(grid: CostGrid, path: PathNode[], cost: number): RouteSummary {
  let maxSlope = 0
  let slopeSum = 0
  for (const p of path) {
    const s = grid.slope[p.y * grid.width + p.x]
    slopeSum += s
    if (s > maxSlope) maxSlope = s
  }
  return {
    path,
    cost,
    distanceMeters: pathDistanceMeters(grid, path),
    maxSlopeDeg: maxSlope,
    averageSlopeDeg: path.length > 0 ? slopeSum / path.length : 0,
  }
}

export function straightLineSummary(
  grid: CostGrid,
  start: PathNode,
  goal: PathNode,
): StraightLineSummary {
  const cells = bresenhamCells(start.x, start.y, goal.x, goal.y)
  let blocked = 0
  for (const c of cells) {
    if (c.x < 0 || c.x >= grid.width || c.y < 0 || c.y >= grid.height) {
      blocked++
      continue
    }
    const idx = c.y * grid.width + c.x
    const diff = grid.difficulty[idx]
    if (diff === 3 && !grid.dangerousAllowed) blocked++
  }
  const startLatLon = gridIndexToLatLon(grid, start.x, start.y)
  const goalLatLon = gridIndexToLatLon(grid, goal.x, goal.y)
  return {
    distanceMeters: haversineDistanceKm(startLatLon, goalLatLon) * 1000,
    blockedCells: blocked,
  }
}

export function explainRouteChoice(
  primary: RouteSummary,
  alternative: RouteSummary | null,
  straight: StraightLineSummary,
): RouteExplanation {
  const pctLonger = straight.distanceMeters
    ? ((primary.distanceMeters - straight.distanceMeters) / straight.distanceMeters) * 100
    : 0
  const energyKJ = primary.cost / 1000

  let primaryText = `Recommended route: ${(primary.distanceMeters / 1000).toFixed(2)} km, ${energyKJ.toFixed(1)} kJ estimated energy. `
  if (pctLonger > 5) {
    primaryText += `It is ${pctLonger.toFixed(0)}% longer than the straight line but avoids steeper terrain. `
  } else if (pctLonger < -5) {
    primaryText += `It is ${Math.abs(pctLonger).toFixed(0)}% shorter than the straight line. `
  } else {
    primaryText += `Its length is close to the straight-line distance. `
  }
  primaryText += `Maximum slope along the route: ${primary.maxSlopeDeg.toFixed(1)}° (average ${primary.averageSlopeDeg.toFixed(1)}°).`

  let comparisonText = ''
  if (alternative && alternative.path.length > 0) {
    const altEnergyKJ = alternative.cost / 1000
    const energyDiff = straight.distanceMeters
      ? ((alternative.cost - primary.cost) / primary.cost) * 100
      : 0
    comparisonText = `Alternative route: ${(alternative.distanceMeters / 1000).toFixed(2)} km, ${altEnergyKJ.toFixed(1)} kJ. `
    if (energyDiff > 5) {
      comparisonText += `The recommended route uses about ${energyDiff.toFixed(0)}% less energy.`
    } else if (energyDiff < -5) {
      comparisonText += `The alternative uses about ${Math.abs(energyDiff).toFixed(0)}% less energy; check whether its slope profile is acceptable.`
    } else {
      comparisonText += `Both routes have similar estimated energy.`
    }
  }

  let cautionText: string | undefined
  if (straight.blockedCells > 0) {
    cautionText = `The straight line crosses ${straight.blockedCells} hazardous or out-of-bounds cells, so a direct route is not feasible with the current slope limit.`
  } else if (primary.maxSlopeDeg > 20) {
    cautionText = `The route includes slopes above 20°. This is a planning estimate, not a certified traversability assessment.`
  }

  return { primaryText, comparisonText, cautionText }
}

/** Integer cell line from (x0,y0) to (x1,y1). */
function bresenhamCells(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): Array<{ x: number; y: number }> {
  const cells: Array<{ x: number; y: number }> = []
  const dx = Math.abs(x1 - x0)
  const dy = Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx - dy
  let x = x0
  let y = y0
  while (true) {
    cells.push({ x, y })
    if (x === x1 && y === y1) break
    const e2 = 2 * err
    if (e2 > -dy) {
      err -= dy
      x += sx
    }
    if (e2 < dx) {
      err += dx
      y += sy
    }
  }
  return cells
}
