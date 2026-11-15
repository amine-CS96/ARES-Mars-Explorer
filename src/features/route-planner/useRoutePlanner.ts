import { useEffect, useMemo, useState } from 'react'
import { useTerrainGrid } from '@/hooks/useTerrainGrid'
import { buildCostGrid, type CostGrid } from '@/engines/terrain/costGrid'
import {
  findPath,
  pathDifficultyBreakdown,
  type PathNode,
  type PathResult,
} from '@/engines/pathfinding/astar'
import {
  defaultCostParams,
  type CostModelParams,
} from '@/engines/pathfinding/costModel'
import {
  explainRouteChoice,
  straightLineSummary,
  summarizeRoute,
  type RouteSummary,
} from '@/engines/pathfinding/explain'
import { latLonToGridIndex, type TerrainGrid } from '@/engines/terrain/terrainGrid'
import type { LatLon } from '@/types/geo'

export interface RoutePlannerOptions {
  maxSlopeDeg: number
  allowDangerous: boolean
  costParams: CostModelParams
  gridCells: number
}

export interface RouteState {
  terrainGrid: TerrainGrid | null
  costGrid: CostGrid | null
  primary: PathResult | null
  alternative: PathResult | null
  straight: ReturnType<typeof straightLineSummary> | null
  primarySummary: RouteSummary | null
  alternativeSummary: RouteSummary | null
  explanation: ReturnType<typeof explainRouteChoice> | null
  difficulty: ReturnType<typeof pathDifficultyBreakdown> | null
  loading: boolean
  error: string | null
}

function nodeFromLatLon(costGrid: CostGrid, point: LatLon): PathNode | null {
  const idx = latLonToGridIndex(costGrid, point)
  if (!idx) return null
  return { x: idx.x, y: idx.y }
}

function buildAlternativeGrid(base: CostGrid, primaryPath: PathNode[]): CostGrid {
  const elevation = new Float32Array(base.elevation)
  let minElev = Number.POSITIVE_INFINITY
  let maxElev = Number.NEGATIVE_INFINITY
  for (const z of base.elevation) {
    if (z < minElev) minElev = z
    if (z > maxElev) maxElev = z
  }
  const penaltyMeters = Math.max(20, maxElev - minElev + 10)
  for (const p of primaryPath) {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const x = p.x + dx
        const y = p.y + dy
        if (x < 0 || x >= base.width || y < 0 || y >= base.height) continue
        const dist = Math.sqrt(dx * dx + dy * dy)
        const add = penaltyMeters * (1 - dist / 3)
        if (add > 0) elevation[y * base.width + x] += add
      }
    }
  }
  return { ...base, elevation }
}

export function useRoutePlanner(
  dem: { metadataPath: string; heightmapPath: string; slopePath: string },
  start: LatLon | null,
  goal: LatLon | null,
  options: RoutePlannerOptions,
): RouteState {
  const terrainQuery = useTerrainGrid({
    metadataUrl: dem.metadataPath,
    heightmapUrl: dem.heightmapPath,
    slopeUrl: dem.slopePath,
  })

  const costGrid = useMemo(() => {
    if (!terrainQuery.data) return null
    return buildCostGrid(terrainQuery.data, {
      maxCells: options.gridCells,
      allowDangerous: options.allowDangerous,
    })
  }, [terrainQuery.data, options.gridCells, options.allowDangerous])

  const [primary, setPrimary] = useState<PathResult | null>(null)
  const [alternative, setAlternative] = useState<PathResult | null>(null)
  const [straight, setStraight] = useState<ReturnType<typeof straightLineSummary> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!costGrid || !start || !goal) {
      setPrimary(null)
      setAlternative(null)
      setStraight(null)
      setError(null)
      return
    }

    const startNode = nodeFromLatLon(costGrid, start)
    const goalNode = nodeFromLatLon(costGrid, goal)
    if (!startNode || !goalNode) {
      setError('Start or destination is outside the DEM coverage.')
      setPrimary(null)
      setAlternative(null)
      setStraight(null)
      return
    }

    setLoading(true)
    setError(null)

    // Yield to the browser so the loading state renders before the search runs.
    const timer = setTimeout(() => {
      try {
        const primaryResult = findPath(costGrid, startNode, goalNode, {
          costParams: options.costParams,
          maxSlopeDeg: options.maxSlopeDeg,
        })
        setPrimary(primaryResult)

        if (primaryResult.reachable && primaryResult.path.length > 0) {
          const altGrid = buildAlternativeGrid(costGrid, primaryResult.path)
          const altResult = findPath(altGrid, startNode, goalNode, {
            costParams: options.costParams,
            maxSlopeDeg: options.maxSlopeDeg,
          })
          setAlternative(altResult.reachable ? altResult : null)
        } else {
          setAlternative(null)
        }

        setStraight(straightLineSummary(costGrid, startNode, goalNode))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Route search failed')
      } finally {
        setLoading(false)
      }
    }, 0)

    return () => clearTimeout(timer)
  }, [costGrid, start, goal, options.maxSlopeDeg, options.costParams])

  const primarySummary = useMemo(
    () => (primary && primary.reachable ? summarizeRoute(costGrid!, primary.path, primary.cost) : null),
    [primary, costGrid],
  )
  const alternativeSummary = useMemo(
    () =>
      alternative && alternative.reachable ? summarizeRoute(costGrid!, alternative.path, alternative.cost) : null,
    [alternative, costGrid],
  )

  const difficulty = useMemo(
    () => (primary && primary.reachable && costGrid ? pathDifficultyBreakdown(costGrid, primary.path) : null),
    [primary, costGrid],
  )

  const explanation = useMemo(() => {
    if (!primarySummary || !straight) return null
    return explainRouteChoice(primarySummary, alternativeSummary, straight)
  }, [primarySummary, alternativeSummary, straight])

  return {
    terrainGrid: terrainQuery.data ?? null,
    costGrid,
    primary,
    alternative,
    straight,
    primarySummary,
    alternativeSummary,
    explanation,
    difficulty,
    loading,
    error,
  }
}

export { defaultCostParams }
