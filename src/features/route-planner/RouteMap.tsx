import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  computeVisibleTiles,
  JEZERO_CONFIG,
  latLonToPixel,
  TileMap,
  useTileMosaic,
} from '@/features/mars-explorer'
import type { PathNode } from '@/engines/pathfinding/astar'
import { gridIndexToLatLon } from '@/engines/terrain/terrainGrid'
import type { CostGrid } from '@/engines/terrain/costGrid'
import type { LatLon } from '@/types/geo'

interface RouteMapProps {
  center: { lat: number; lon: number }
  zoom: number
  onCenterChange: (center: { lat: number; lon: number }) => void
  onZoomChange: (zoom: number) => void
  onMapClick: (point: LatLon) => void
  start: LatLon | null
  goal: LatLon | null
  primaryPath: PathNode[] | null
  alternativePath: PathNode[] | null
  costGrid: CostGrid | null
  cursor: LatLon | null
  onCursor: (point: LatLon | null) => void
}

export function RouteMap({
  center,
  zoom,
  onCenterChange,
  onZoomChange,
  onMapClick,
  start,
  goal,
  primaryPath,
  alternativePath,
  costGrid,
  cursor,
  onCursor,
}: RouteMapProps) {
  const config = JEZERO_CONFIG
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  const activeLayer = config.layers[1] ?? config.layers[0]

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => {
      const rect = el.getBoundingClientRect()
      setSize({ width: Math.floor(rect.width), height: Math.floor(rect.height) })
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const visibleTiles = useMemo(() => {
    if (size.width === 0 || size.height === 0) return []
    return computeVisibleTiles(center, zoom, size)
  }, [center, zoom, size])

  const mosaic = useTileMosaic(activeLayer, visibleTiles)

  const primaryPoints = useMemo(() => {
    if (!primaryPath || !costGrid) return []
    return primaryPath.map((p) => gridIndexToLatLon(costGrid, p.x, p.y))
  }, [primaryPath, costGrid])

  const alternativePoints = useMemo(() => {
    if (!alternativePath || !costGrid) return []
    return alternativePath.map((p) => gridIndexToLatLon(costGrid, p.x, p.y))
  }, [alternativePath, costGrid])

  const svgPoints = useCallback(
    (points: LatLon[]) =>
      points
        .map((p) => {
          const { x, y } = latLonToPixel(p, center, zoom, size)
          return `${x},${y}`
        })
        .join(' '),
    [center, zoom, size],
  )

  const startPixel = start ? latLonToPixel(start, center, zoom, size) : null
  const goalPixel = goal ? latLonToPixel(goal, center, zoom, size) : null
  const straightPoints = useMemo(() => {
    if (!start || !goal) return null
    return svgPoints([start, goal])
  }, [start, goal, svgPoints])

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden rounded-xl border border-line bg-surface">
      <TileMap
        config={config}
        zoom={zoom}
        center={center}
        onCenterChange={onCenterChange}
        onZoomChange={onZoomChange}
        onClick={onMapClick}
        onCursor={onCursor}
        mosaic={mosaic}
      />
      <svg className="pointer-events-none absolute inset-0 z-20" width={size.width} height={size.height}>
        {/* Straight line comparison */}
        {straightPoints ? (
          <polyline
            points={straightPoints}
            fill="none"
            stroke="#6b7a94"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            opacity={0.6}
          />
        ) : null}
        {/* Alternative route */}
        {alternativePoints.length > 0 ? (
          <polyline
            points={svgPoints(alternativePoints)}
            fill="none"
            stroke="#fbbf24"
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={0.65}
          />
        ) : null}
        {/* Primary route */}
        {primaryPoints.length > 0 ? (
          <polyline
            points={svgPoints(primaryPoints)}
            fill="none"
            stroke="#53d6e8"
            strokeWidth={3}
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={0.9}
          />
        ) : null}
        {/* Start marker */}
        {startPixel ? (
          <g transform={`translate(${startPixel.x}, ${startPixel.y})`}>
            <circle r={6} fill="#34d399" stroke="#080b12" strokeWidth={2} />
          </g>
        ) : null}
        {/* Goal marker */}
        {goalPixel ? (
          <g transform={`translate(${goalPixel.x}, ${goalPixel.y})`}>
            <circle r={6} fill="#e56b3f" stroke="#080b12" strokeWidth={2} />
          </g>
        ) : null}
      </svg>
      {cursor ? (
        <div className="pointer-events-none absolute bottom-3 left-3 z-30 rounded-lg border border-line bg-space/85 px-2.5 py-1.5 font-mono text-[10px] text-cyan/90 backdrop-blur-md">
          {cursor.lat.toFixed(4)}° N, {cursor.lon.toFixed(4)}° E
        </div>
      ) : null}
    </div>
  )
}
