import { useMemo } from 'react'
import { latLonToPixel } from '@/features/mars-explorer'
import type { RoverWaypoint } from '@/features/mars-explorer'

interface RoverTrackOverlayProps {
  waypoints: RoverWaypoint[] | null
  center: { lat: number; lon: number }
  zoom: number
  size: { width: number; height: number }
  visible: boolean
}

/**
 * Perseverance traverse overlay from the committed MMGIS waypoint snapshot
 * (`/data/M20_waypoints.json`, NASA/JPL-Caltech). Points outside the DEM bbox are skipped so
 * the track only renders where the analysis is valid.
 */
export function RoverTrackOverlay({ waypoints, center, zoom, size, visible }: RoverTrackOverlayProps) {
  const track = useMemo(() => {
    if (!visible || !waypoints || size.width === 0) return null
    // The snapshot covers the full traverse; the DEM only covers Jezero.
    const inBbox = (wp: RoverWaypoint) =>
      wp.lat >= 18.15 && wp.lat <= 18.78 && wp.lon >= 77.1 && wp.lon <= 77.76
    const filtered = waypoints.filter(inBbox)
    if (filtered.length < 2) return null
    return {
      path: filtered.map((wp) => latLonToPixel(wp, center, zoom, size)),
      start: latLonToPixel(filtered[0], center, zoom, size),
      end: latLonToPixel(filtered[filtered.length - 1], center, zoom, size),
      count: filtered.length,
    }
  }, [waypoints, center, zoom, size, visible])

  if (!track) return null

  const pathD = track.path
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ')

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-[25]"
      width={size.width}
      height={size.height}
      aria-label={`Perseverance traverse, ${track.count} waypoints`}
    >
      <path
        d={pathD}
        fill="none"
        stroke="#e56b3f"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.85}
      />
      {track.start ? (
        <circle cx={track.start.x} cy={track.start.y} r={4} fill="#34d399" stroke="#080b12" strokeWidth={1.25} />
      ) : null}
      {track.end ? (
        <circle cx={track.end.x} cy={track.end.y} r={4} fill="#e56b3f" stroke="#080b12" strokeWidth={1.25} />
      ) : null}
    </svg>
  )
}
