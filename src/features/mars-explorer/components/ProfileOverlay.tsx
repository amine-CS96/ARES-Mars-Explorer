import { useMemo } from 'react'
import { latLonToPixel } from '../viewport'
import type { LatLon } from '@/types/geo'

interface ProfileOverlayProps {
  points: LatLon[]
  center: { lat: number; lon: number }
  zoom: number
  size: { width: number; height: number }
}

export function ProfileOverlay({ points, center, zoom, size }: ProfileOverlayProps) {
  const projected = useMemo(() => {
    return points.map((p) => latLonToPixel(p, center, zoom, size))
  }, [points, center, zoom, size])

  if (projected.length < 1) return null

  const pathD = projected.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')

  return (
    <svg className="pointer-events-none absolute inset-0 z-20" width={size.width} height={size.height}>
      {projected.length > 1 ? (
        <path
          d={pathD}
          fill="none"
          stroke="#e56b3f"
          strokeWidth={2}
          strokeDasharray="4 4"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.9}
        />
      ) : null}
      {projected.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={5} fill="#e56b3f" stroke="#080b12" strokeWidth={2} />
          <text
            x={p.x + 8}
            y={p.y - 8}
            fill="#f5f7fa"
            fontSize={10}
            fontFamily="JetBrains Mono, monospace"
          >
            {i === 0 ? 'Start' : 'End'}
          </text>
        </g>
      ))}
    </svg>
  )
}
