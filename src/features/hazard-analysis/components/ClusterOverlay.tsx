import { useMemo } from 'react'
import { latLonToPixel } from '@/features/mars-explorer'
import type { HazardCluster } from '@/engines/hazards/hazardDetection'
import { SEVERITY_COLORS } from '@/engines/hazards/riskModel'

interface ClusterOverlayProps {
  clusters: HazardCluster[]
  selectedId: number | null | undefined
  /** Clusters highlighted from analytics selection or inventory hover (multiple allowed). */
  highlightedIds?: number[]
  onSelect: (cluster: HazardCluster) => void
  onHover: (cluster: HazardCluster | null) => void
  center: { lat: number; lon: number }
  zoom: number
  size: { width: number; height: number }
  visible: boolean
}

/**
 * SVG cluster outlines in the severity visual language (matching inventory cards and legends).
 * Fills are translucent so the base imagery stays visible; selection gets a solid outline plus
 * halo, and hover gets a subtle preview highlight. Clicking a cluster selects it.
 */
export function ClusterOverlay({
  clusters,
  selectedId,
  highlightedIds = [],
  onSelect,
  onHover,
  center,
  zoom,
  size,
  visible,
}: ClusterOverlayProps) {
  const highlightSet = useMemo(() => new Set(highlightedIds), [highlightedIds])
  const rects = useMemo(() => {
    if (!visible || size.width === 0) return []
    return clusters
      .map((c) => {
        const nw = latLonToPixel({ lat: c.bbox.north, lon: c.bbox.west }, center, zoom, size)
        const se = latLonToPixel({ lat: c.bbox.south, lon: c.bbox.east }, center, zoom, size)
        return {
          cluster: c,
          x: nw.x,
          y: nw.y,
          width: se.x - nw.x,
          height: se.y - nw.y,
        }
      })
      .filter(
        (r) =>
          r.width > 1 &&
          r.height > 1 &&
          r.x < size.width + 40 &&
          r.x + r.width > -40 &&
          r.y < size.height + 40 &&
          r.y + r.height > -40,
      )
  }, [clusters, center, zoom, size, visible])

  if (!visible || rects.length === 0) return null

  return (
    <svg
      className="absolute inset-0 z-20"
      width={size.width}
      height={size.height}
      role="group"
      aria-label="Hazard cluster outlines"
    >
      {rects.map((r) => {
        const color = SEVERITY_COLORS[r.cluster.severity]
        const isSelected = selectedId === r.cluster.id
        const isHighlighted = highlightSet.has(r.cluster.id)
        return (
          <g key={r.cluster.id}>
            {isSelected ? (
              <rect
                x={r.x - 3}
                y={r.y - 3}
                width={r.width + 6}
                height={r.height + 6}
                fill="none"
                stroke={color}
                strokeOpacity={0.35}
                strokeWidth={6}
                rx={3}
                className="pointer-events-none"
              />
            ) : null}
            <rect
              x={r.x}
              y={r.y}
              width={r.width}
              height={r.height}
              fill={color}
              fillOpacity={isSelected ? 0.16 : isHighlighted ? 0.14 : 0.07}
              stroke={color}
              strokeOpacity={isSelected || isHighlighted ? 0.95 : 0.55}
              strokeWidth={isSelected ? 2 : isHighlighted ? 1.75 : 1.25}
              strokeDasharray={isSelected ? undefined : '6 4'}
              rx={2}
              className="cursor-pointer"
              onClick={() => onSelect(r.cluster)}
              onMouseEnter={() => onHover(r.cluster)}
              onMouseLeave={() => onHover(null)}
            />
            <text
              x={r.x + 5}
              y={r.y + 14}
              fill={color}
              fontSize={10}
              fontFamily="JetBrains Mono, monospace"
              fontWeight={600}
              opacity={isSelected || isHighlighted ? 1 : 0.85}
              className="pointer-events-none"
            >
              H{r.cluster.id}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
