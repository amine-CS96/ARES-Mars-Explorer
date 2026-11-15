import { useMemo } from 'react'
import { latLonToPixel } from '../viewport'
import type { LatLon } from '@/types/geo'

interface GridOverlayProps {
  center: LatLon
  zoom: number
  size: { width: number; height: number }
  visible: boolean
}

/** Pick a nice interval for lat/lon grid lines based on zoom. */
function gridInterval(zoom: number): number {
  if (zoom >= 16) return 0.0025
  if (zoom >= 14) return 0.005
  if (zoom >= 12) return 0.01
  if (zoom >= 10) return 0.025
  if (zoom >= 8) return 0.05
  if (zoom >= 6) return 0.1
  if (zoom >= 4) return 0.25
  return 0.5
}

export function GridOverlay({ center, zoom, size, visible }: GridOverlayProps) {
  const lines = useMemo<{
    vertical: Array<{ x: number; lon: number }>
    horizontal: Array<{ y: number; lat: number }>
  }>(() => {
    if (!visible || size.width === 0 || size.height === 0) {
      return { vertical: [], horizontal: [] }
    }

    const interval = gridInterval(zoom)
    const halfSpanLon = (size.width / (2 ** (zoom + 1) * 256)) * 360
    const halfSpanLat = (size.height / (2 ** zoom * 256)) * 180

    const minLon = Math.floor((center.lon - halfSpanLon) / interval) * interval
    const maxLon = Math.ceil((center.lon + halfSpanLon) / interval) * interval
    const minLat = Math.floor((center.lat - halfSpanLat) / interval) * interval
    const maxLat = Math.ceil((center.lat + halfSpanLat) / interval) * interval

    const vertical: Array<{ x: number; lon: number }> = []
    for (let lon = minLon; lon <= maxLon; lon += interval) {
      const p = latLonToPixel({ lat: center.lat, lon }, center, zoom, size)
      if (p.x >= -20 && p.x <= size.width + 20) {
        vertical.push({ x: p.x, lon })
      }
    }

    const horizontal: Array<{ y: number; lat: number }> = []
    for (let lat = minLat; lat <= maxLat; lat += interval) {
      const p = latLonToPixel({ lat, lon: center.lon }, center, zoom, size)
      if (p.y >= -20 && p.y <= size.height + 20) {
        horizontal.push({ y: p.y, lat })
      }
    }

    return { vertical, horizontal }
  }, [center, zoom, size, visible])

  if (!visible || lines.vertical.length === 0) return null

  return (
    <svg className="pointer-events-none absolute inset-0 z-10" width={size.width} height={size.height}>
      {lines.vertical.map(({ x, lon }) => (
        <g key={`v-${lon}`}>
          <line x1={x} y1={0} x2={x} y2={size.height} stroke="#53d6e8" strokeWidth={0.5} opacity={0.35} />
          <text
            x={x + 4}
            y={12}
            fill="#9aa7bd"
            fontSize={9}
            fontFamily="JetBrains Mono, monospace"
            opacity={0.7}
          >
            {lon.toFixed(Math.abs(lon) < 1 ? 3 : 2)}°
          </text>
        </g>
      ))}
      {lines.horizontal.map(({ y, lat }) => (
        <g key={`h-${lat}`}>
          <line x1={0} y1={y} x2={size.width} y2={y} stroke="#53d6e8" strokeWidth={0.5} opacity={0.35} />
          <text
            x={4}
            y={y - 4}
            fill="#9aa7bd"
            fontSize={9}
            fontFamily="JetBrains Mono, monospace"
            opacity={0.7}
          >
            {lat.toFixed(Math.abs(lat) < 1 ? 3 : 2)}°
          </text>
        </g>
      ))}
    </svg>
  )
}
