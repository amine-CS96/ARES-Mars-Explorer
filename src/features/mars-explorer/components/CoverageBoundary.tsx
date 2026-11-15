import { useMemo } from 'react'
import { latLonToPixel } from '../viewport'

interface Boundary {
  id: string
  name: string
  color: string
  bbox: { west: number; south: number; east: number; north: number }
}

interface CoverageBoundaryProps {
  boundaries: Boundary[]
  center: { lat: number; lon: number }
  zoom: number
  size: { width: number; height: number }
  visible: boolean
}

export function CoverageBoundary({
  boundaries,
  center,
  zoom,
  size,
  visible,
}: CoverageBoundaryProps) {
  const rects = useMemo(() => {
    if (!visible || size.width === 0) return []
    return boundaries.map((b) => {
      const nw = latLonToPixel({ lat: b.bbox.north, lon: b.bbox.west }, center, zoom, size)
      const se = latLonToPixel({ lat: b.bbox.south, lon: b.bbox.east }, center, zoom, size)
      return {
        ...b,
        x: nw.x,
        y: nw.y,
        width: se.x - nw.x,
        height: se.y - nw.y,
      }
    })
  }, [boundaries, center, zoom, size, visible])

  if (!visible || rects.length === 0) return null

  return (
    <svg className="pointer-events-none absolute inset-0 z-15" width={size.width} height={size.height}>
      {rects.map((r) => (
        <g key={r.id}>
          <rect
            x={r.x}
            y={r.y}
            width={r.width}
            height={r.height}
            fill="none"
            stroke={r.color}
            strokeWidth={1.5}
            strokeDasharray="6 4"
            opacity={0.85}
          />
          <text
            x={r.x + 6}
            y={r.y + 16}
            fill={r.color}
            fontSize={10}
            fontFamily="JetBrains Mono, monospace"
            fontWeight={500}
            opacity={0.9}
          >
            {r.name}
          </text>
        </g>
      ))}
    </svg>
  )
}
