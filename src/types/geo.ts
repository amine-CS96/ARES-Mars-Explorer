/** Basic geographic primitives shared across the app. */

/** Latitude/longitude in degrees. Longitude is east-positive within [-180, 180]. */
export interface LatLon {
  lat: number
  lon: number
}

/** How well a coordinate is established. Rendered via AccuracyBadge. */
export type CoordinateAccuracy = 'verified' | 'approximate' | 'illustrative'
