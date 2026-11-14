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
  fetchedAt: string
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
  geometry: {
    type: 'Point'
    coordinates: string
  }
}

export interface MmgisWaypointCollection {
  type: 'FeatureCollection'
  features: MmgisFeature[]
}

export function parseRoverWaypoints(data: MmgisWaypointCollection): RoverTrack {
  const waypoints = data.features.map((feature) => {
    const [lonStr, latStr, elevStr] = feature.geometry.coordinates.trim().split(/\s+/)
    return {
      lon: Number.parseFloat(lonStr),
      lat: Number.parseFloat(latStr),
      elevMeters: Number.parseFloat(elevStr),
      sol: feature.properties.sol,
      drive: feature.properties.drive,
      site: feature.properties.site,
      totalDistanceMeters: feature.properties.dist_total_m,
    }
  })
  return { waypoints, fetchedAt: new Date().toISOString() }
}
