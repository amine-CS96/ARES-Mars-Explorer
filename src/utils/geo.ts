import type { LatLon } from '@/types/geo'

/** Mars mean volumetric radius. NASA NSSDCA Mars Fact Sheet. */
export const MARS_MEAN_RADIUS_KM = 3389.5

/** Wrap a longitude from the 0–360°E convention into east-positive [-180, 180]. */
export function lon360to180(lon: number): number {
  return (((lon + 180) % 360) + 360) % 360 - 180
}

/** Convert east-positive [-180, 180] longitude into the 0–360°E convention. */
export function lon180to360(lon: number): number {
  return ((lon % 360) + 360) % 360
}

/**
 * Great-circle distance on a sphere (haversine). Mars is treated as a sphere with the mean
 * radius — adequate for route planning at exploration scales.
 */
export function haversineDistanceKm(a: LatLon, b: LatLon, radiusKm = MARS_MEAN_RADIUS_KM): number {
  const toRad = Math.PI / 180
  const dLat = (b.lat - a.lat) * toRad
  const dLon = (b.lon - a.lon) * toRad
  const lat1 = a.lat * toRad
  const lat2 = b.lat * toRad
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 2 * radiusKm * Math.asin(Math.min(1, Math.sqrt(h)))
}

export function isValidLatLon(coord: LatLon): boolean {
  return (
    Number.isFinite(coord.lat) &&
    Number.isFinite(coord.lon) &&
    Math.abs(coord.lat) <= 90 &&
    Math.abs(coord.lon) <= 180
  )
}

function dmsString(deg: number): string {
  const d = Math.floor(deg)
  const mFloat = (deg - d) * 60
  const m = Math.floor(mFloat)
  const s = Math.round((mFloat - m) * 60)
  if (s === 60) {
    const m2 = m + 1
    if (m2 === 60) return `${d + 1}°00′00″`
    return `${d}°${String(m2).padStart(2, '0')}′00″`
  }
  return `${d}°${String(m).padStart(2, '0')}′${String(s).padStart(2, '0')}″`
}

export interface LatLonFormatOptions {
  /** Degrees/minutes/seconds instead of decimal degrees. */
  dms?: boolean
  decimals?: number
}

/** e.g. "18.4447° N, 77.4508° E" or "18°26′41″ N, 77°27′03″ E". */
export function formatLatLon(coord: LatLon, options: LatLonFormatOptions = {}): string {
  const { dms = false, decimals = 4 } = options
  const latHemi = coord.lat >= 0 ? 'N' : 'S'
  const lonHemi = coord.lon >= 0 ? 'E' : 'W'
  if (dms) {
    return `${dmsString(Math.abs(coord.lat))} ${latHemi}, ${dmsString(Math.abs(coord.lon))} ${lonHemi}`
  }
  return `${Math.abs(coord.lat).toFixed(decimals)}° ${latHemi}, ${Math.abs(
    coord.lon,
  ).toFixed(decimals)}° ${lonHemi}`
}
