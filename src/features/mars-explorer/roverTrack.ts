/**
 * MMGIS Perseverance waypoint feed parser. The feed is a GeoJSON FeatureCollection where each
 * feature's `geometry.coordinates` is a space-separated "lon lat elev" string and properties
 * contain drive metadata.
 */

export interface RoverWaypoint {
  lon: number
  lat: number
  elevMeters: number
  sol: number
  drive: number
  site: number
  totalDistanceMeters: number
}

export interface RoverTrack {
  waypoints: RoverWaypoint[]
  /** Static snapshot label — not a real-time telemetry timestamp. */
  snapshotLabel: string
}

export interface MmgisGeometry {
  type: 'Point'
  /** The live feed uses a "lon lat elev" string; some snapshots use a [lon, lat, elev] array. */
  coordinates: string | number[]
}

export interface MmgisFeature {
  type: 'Feature'
  properties: {
    sol: number
    drive: number
    site: number
    lon: number
    lat: number
    elev_geoid: number
    dist_total_m: number
  }
  geometry: MmgisGeometry
}

export interface MmgisWaypointCollection {
  type: 'FeatureCollection'
  name?: string
  features: MmgisFeature[]
}

function readCoordinates(raw: string | number[]): { lon: number; lat: number; elev: number } | null {
  const parts = Array.isArray(raw)
    ? raw.map((n) => String(n))
    : raw.trim().split(/\s+/)
  if (parts.length < 3) return null
  const lon = Number.parseFloat(parts[0])
  const lat = Number.parseFloat(parts[1])
  const elev = Number.parseFloat(parts[2])
  if (!Number.isFinite(lon) || !Number.isFinite(lat) || !Number.isFinite(elev)) return null
  return { lon, lat, elev }
}

export function parseRoverWaypoints(data: MmgisWaypointCollection): RoverTrack {
  const waypoints: RoverWaypoint[] = []
  for (const feature of data.features) {
    const c = readCoordinates(feature.geometry.coordinates)
    if (!c) continue
    waypoints.push({
      lon: c.lon,
      lat: c.lat,
      elevMeters: c.elev,
      sol: feature.properties.sol,
      drive: feature.properties.drive,
      site: feature.properties.site,
      totalDistanceMeters: feature.properties.dist_total_m,
    })
  }
  const snapshotLabel = data.name ?? 'Perseverance waypoints snapshot'
  return { waypoints, snapshotLabel }
}
