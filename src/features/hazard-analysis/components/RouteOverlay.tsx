import { useMemo } from 'react'
import { latLonToPixel } from '@/features/mars-explorer'
import type { RouteExposureResult } from '@/engines/hazards/routeExposure'
import { SEVERITY_COLORS } from '@/engines/hazards/riskModel'
import type { Severity } from '@/engines/hazards/riskModel'

interface RouteOverlayProps {
  exposure: RouteExposureResult | null
  center: { lat: number; lon: number }
  zoom: number
  size: { width: number; height: number }
  visible: boolean
}

/**
 * SVG overlay of the imported Planner route. The path is drawn as consecutive segments colored
 * by the *computed* per-cell severity (no smoothing or invented colors), with start and
 * destination markers. Requires ≥ 2 segments to render.
 */
export function RouteOverlay({ exposure, center, zoom, size, visible }: RouteOverlayProps) {
  const lines = useMemo(() => {
    if (!visible || !exposure || size.width === 0 || exposure.segments.length < 2) return []
    const toPx = (latLon: { lat: number; lon: number }) =>
      latLonToPixel(latLon, center, zoom, size)
    const result: Array<{
      key: string
      x1: number
      y1: number
      x2: number
      y2: number
      severity: Severity
    }> = []
    for (let i = 0; i < exposure.segments.length - 1; i++) {
      const a = toPx(exposure.segments[i].latLon)
      const b = toPx(exposure.segments[i + 1].latLon)
      // Skip segments fully outside the viewport (with margin).
      const margin = 60
      if (
        (a.x < -margin && b.x < -margin) ||
        (a.x > size.width + margin && b.x > size.width + margin) ||
        (a.y < -margin && b.y < -margin) ||
        (a.y > size.height + margin && b.y > size.height + margin)
      ) {
        continue
      }
      result.push({
        key: `${i}`,
        x1: a.x,
        y1: a.y,
        x2: b.x,
        y2: b.y,
        severity: exposure.segments[i + 1].severity,
      })
    }
    return result
  }, [exposure, center, zoom, size, visible])

  const endpoints = useMemo(() => {
    if (!visible || !exposure || size.width === 0 || exposure.segments.length < 2) return []
    const first = latLonToPixel(exposure.segments[0].latLon, center, zoom, size)
    const last = latLonToPixel(
      exposure.segments[exposure.segments.length - 1].latLon,
      center,
      zoom,
      size,
    )
    // Marker colors reuse the severity palette (low = green, unknown = neutral) to stay in the
    // project's visual language without inventing new hex values.
    return [
      { x: first.x, y: first.y, color: SEVERITY_COLORS.low },
      { x: last.x, y: last.y, color: SEVERITY_COLORS.unknown },
    ]
  }, [exposure, center, zoom, size, visible])

  if (lines.length === 0) return null

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-30"
      width={size.width}
      height={size.height}
      aria-label={`Planner route geometry, ${lines.length} segments`}
    >
      {lines.map((l) => (
        <line
          key={l.key}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          stroke={SEVERITY_COLORS[l.severity]}
          strokeWidth={l.severity === 'critical' || l.severity === 'high' ? 3 : 2.25}
          strokeLinecap="round"
          strokeOpacity={0.95}
        />
      ))}
      {endpoints.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={5} fill={p.color} stroke="#080b12" strokeWidth={1.5} />
        </g>
      ))}
    </svg>
  )
}
