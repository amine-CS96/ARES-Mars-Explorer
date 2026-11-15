import type { CostGrid, Difficulty } from '@/engines/terrain/costGrid'
import {
  cellElevation,
  difficultyFromIndex,
  isCellTraversable,
} from '@/engines/terrain/costGrid'
import { edgeEnergyJoules, minEnergyPerMeter, type CostModelParams } from './costModel'

/**
 * A* pathfinding on an 8-connected cost grid.
 *
 * - Edge cost = metabolic energy between cell centers (Pandolf-derived).
 * - Cells marked hazardous are forbidden unless `grid.dangerousAllowed` is true.
 * - Edges whose absolute grade exceeds `maxSlopeDeg` are forbidden.
 * - Diagonal moves cost sqrt(2) × orthogonal distance and are blocked if either adjacent
 *   orthogonal neighbor is untraversable (no corner cutting).
 * - Heuristic = flat-energy straight-line distance, which is admissible.
 */

export interface PathNode {
  x: number
  y: number
}

export interface PathResult {
  /** Grid cells from start to goal (inclusive). Empty if no path found. */
  path: PathNode[]
  /** Total energy cost of the returned path (joules). */
  cost: number
  /** Number of cells visited by the search. */
  visited: number
  /** True if a path was found. */
  reachable: boolean
}

export interface AStarOptions {
  costParams: CostModelParams
  /** Absolute slope threshold in degrees above which an edge is forbidden. */
  maxSlopeDeg?: number
}

interface HeapNode {
  index: number
  f: number
}

class BinaryHeap {
  private heap: HeapNode[] = []

  push(index: number, f: number): void {
    this.heap.push({ index, f })
    this.bubbleUp(this.heap.length - 1)
  }

  pop(): HeapNode | undefined {
    const top = this.heap[0]
    const last = this.heap.pop()
    if (last && this.heap.length > 0) {
      this.heap[0] = last
      this.bubbleDown(0)
    }
    return top
  }

  private bubbleUp(i: number): void {
    const node = this.heap[i]
    while (i > 0) {
      const parent = (i - 1) >> 1
      if (this.heap[parent].f <= node.f) break
      this.heap[i] = this.heap[parent]
      i = parent
    }
    this.heap[i] = node
  }

  private bubbleDown(i: number): void {
    const node = this.heap[i]
    const n = this.heap.length
    while (true) {
      const left = 2 * i + 1
      const right = left + 1
      let smallest = i
      if (left < n && this.heap[left].f < this.heap[smallest].f) smallest = left
      if (right < n && this.heap[right].f < this.heap[smallest].f) smallest = right
      if (smallest === i) break
      this.heap[i] = this.heap[smallest]
      i = smallest
    }
    this.heap[i] = node
  }
}

const NEIGHBORS: Array<[dx: number, dy: number, cost: number]> = [
  [1, 0, 1],
  [-1, 0, 1],
  [0, 1, 1],
  [0, -1, 1],
  [1, 1, Math.SQRT2],
  [1, -1, Math.SQRT2],
  [-1, 1, Math.SQRT2],
  [-1, -1, Math.SQRT2],
]

export function findPath(
  grid: CostGrid,
  start: PathNode,
  goal: PathNode,
  options: AStarOptions,
): PathResult {
  const { width, height } = grid
  const costParams = options.costParams
  const maxSlopeDeg = options.maxSlopeDeg ?? 25
  const minCost = minEnergyPerMeter(costParams)

  if (!isCellTraversable(grid, start.x, start.y) || !isCellTraversable(grid, goal.x, goal.y)) {
    return { path: [], cost: 0, visited: 0, reachable: false }
  }

  const nodeCount = width * height
  const gScore = new Float64Array(nodeCount).fill(Number.POSITIVE_INFINITY)
  const fScore = new Float64Array(nodeCount).fill(Number.POSITIVE_INFINITY)
  const cameFrom = new Int32Array(nodeCount).fill(-1)
  const closed = new Uint8Array(nodeCount)

  const startIdx = start.y * width + start.x
  const goalIdx = goal.y * width + goal.x
  gScore[startIdx] = 0
  fScore[startIdx] = heuristic(start, goal, minCost, grid)

  const open = new BinaryHeap()
  open.push(startIdx, fScore[startIdx])

  let visited = 0

  while (true) {
    const current = open.pop()
    if (!current) break
    const currentIdx = current.index
    if (closed[currentIdx]) continue
    closed[currentIdx] = 1
    visited++

    if (currentIdx === goalIdx) {
      return {
        path: reconstructPath(cameFrom, goalIdx, width),
        cost: gScore[goalIdx],
        visited,
        reachable: true,
      }
    }

    const cx = currentIdx % width
    const cy = Math.floor(currentIdx / width)
    const zA = cellElevation(grid, cx, cy)

    for (const [dx, dy, distFactor] of NEIGHBORS) {
      const nx = cx + dx
      const ny = cy + dy
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue

      // Corner-cut prevention: diagonal moves require both orthogonal neighbors to be traversable.
      if (dx !== 0 && dy !== 0) {
        if (!isCellTraversable(grid, cx + dx, cy) || !isCellTraversable(grid, cx, cy + dy)) {
          continue
        }
      }

      const nIdx = ny * width + nx
      if (closed[nIdx]) continue
      if (!isCellTraversable(grid, nx, ny)) continue

      const zB = cellElevation(grid, nx, ny)
      const horizontalM = distFactor * grid.metersPerPixel
      const rise = zB - zA
      const edgeSlopeDeg = (Math.atan(Math.abs(rise) / horizontalM) * 180) / Math.PI
      if (edgeSlopeDeg > maxSlopeDeg) continue

      const tentativeG = gScore[currentIdx] + edgeEnergyJoules(zA, zB, horizontalM, costParams)
      if (tentativeG >= gScore[nIdx]) continue

      cameFrom[nIdx] = currentIdx
      gScore[nIdx] = tentativeG
      fScore[nIdx] = tentativeG + heuristic({ x: nx, y: ny }, goal, minCost, grid)
      open.push(nIdx, fScore[nIdx])
    }
  }

  return { path: [], cost: 0, visited, reachable: false }
}

function heuristic(a: PathNode, b: PathNode, minCostPerMeter: number, grid: CostGrid): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  const distM = Math.sqrt(dx * dx + dy * dy) * grid.metersPerPixel
  return distM * minCostPerMeter
}

function reconstructPath(cameFrom: Int32Array, goalIdx: number, width: number): PathNode[] {
  const path: PathNode[] = []
  let idx = goalIdx
  while (idx >= 0) {
    path.unshift({ x: idx % width, y: Math.floor(idx / width) })
    idx = cameFrom[idx]
  }
  return path
}

export function pathDifficultyBreakdown(
  grid: CostGrid,
  path: PathNode[],
): Record<Difficulty, number> {
  const counts: Record<Difficulty, number> = { flat: 0, moderate: 0, steep: 0, hazardous: 0 }
  for (const p of path) {
    const idx = p.y * grid.width + p.x
    const key = difficultyFromIndex(grid.difficulty[idx])
    counts[key]++
  }
  return counts
}
