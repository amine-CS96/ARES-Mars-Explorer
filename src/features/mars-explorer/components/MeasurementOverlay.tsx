import { useMemo } from 'react'
import { latLonToPixel } from '../viewport'
import { haversineDistanceKm } from '@/utils/geo'
import type { LatLon } from '@/types/geo'

interface MeasurementOverlayProps {
  points: LatLon[]
  center: { lat: number; lon: number }
  zoom: number
  size: { width: number; height: number }
}

export function MeasurementOverlay({ points, center, zoom, size }: MeasurementOverlayProps) {
  const projected = useMemo(() => {
    return points.map((p) => latLonToPixel(p, center, zoom, size))
  }, [points, center, zoom, size])

  const distanceKm = useMemo(() => {
    if (points.length < 2) return 0
    return haversineDistanceKm(points[0], points[points.length - 1])
  }, [points])

  if (projected.length < 1) return null

  const pathD = projected.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')

  return (
    <svg className="pointer-events-none absolute inset-0 z-20" width={size.width} height={size.height}>
      {projected.length > 1 ? (
        <path
          d={pathD}
          fill="none"
          stroke="#53d6e8"
          strokeWidth={2}
          strokeDasharray="6 4"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.9}
        />
      ) : null}
      {projected.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={5} fill="#53d6e8" stroke="#080b12" strokeWidth={2} />
          <text
            x={p.x + 8}
            y={p.y - 8}
            fill="#f5f7fa"
            fontSize={10}
            fontFamily="JetBrains Mono, monospace"
          >
            {String.fromCharCode(65 + i)}
          </text>
        </g>
      ))}
      {distanceKm > 0 && projected.length >= 2 ? (
        <g>
          <rect
            x={(projected[0].x + projected[projected.length - 1].x) / 2 - 40}
            y={(projected[0].y + projected[projected.length - 1].y) / 2 - 20}
            width={80}
            height={18}
            rx={4}
            fill="#080b12"
            stroke="#53d6e8"
            strokeWidth={1}
            opacity={0.85}
          />
          <text
            x={(projected[0].x + projected[projected.length - 1].x) / 2}
            y={(projected[0].y + projected[projected.length - 1].y) / 2 - 8}
            fill="#53d6e8"
            fontSize={10}
            fontFamily="JetBrains Mono, monospace"
            textAnchor="middle"
          >
            {distanceKm >= 1
              ? `${distanceKm.toFixed(2)} km`
              : `${(distanceKm * 1000).toFixed(0)} m`}
          </text>
        </g>
      ) : null}
    </svg>
  )
}
