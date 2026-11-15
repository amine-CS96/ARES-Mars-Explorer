import { MARS_MEAN_RADIUS_KM } from '@/utils/geo'

interface ScaleBarProps {
  zoom: number
  latitude: number
}

/** Horizontal meters per pixel at the equator for zoom z in the default028mm matrix. */
function metersPerPixelAtEquator(zoom: number): number {
  // Zoom 0: world is 512 px wide (2 cols * 256) spanning 360°.
  const circumferenceKm = 2 * Math.PI * MARS_MEAN_RADIUS_KM
  const worldWidthPx = 2 ** (zoom + 1) * 256
  return (circumferenceKm * 1000) / worldWidthPx
}

const NICE_DISTANCES = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000]

export function ScaleBar({ zoom, latitude }: ScaleBarProps) {
  const mpp = metersPerPixelAtEquator(zoom) * Math.cos((latitude * Math.PI) / 180)
  const targetMeters = mpp * 120 // bar length in meters for ~120 screen px

  const displayMeters = NICE_DISTANCES.reduce((prev, curr) =>
    Math.abs(curr - targetMeters) < Math.abs(prev - targetMeters) ? curr : prev,
  )

  const barWidthPx = displayMeters / mpp
  const label =
    displayMeters >= 1000
      ? `${(displayMeters / 1000).toFixed(displayMeters % 1000 === 0 ? 0 : 1)} km`
      : `${displayMeters} m`

  return (
    <div className="pointer-events-auto rounded-lg border border-line bg-space/85 px-2.5 py-1.5 backdrop-blur-md">
      <div className="flex items-end" style={{ width: Math.max(40, Math.min(barWidthPx, 160)) }}>
        <div className="h-2 flex-1 border-b-2 border-l-2 border-r-2 border-ink" />
      </div>
      <p className="mt-1 text-center font-mono text-[9px] text-ink">{label}</p>
    </div>
  )
}
