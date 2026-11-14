import type { LatLon } from '@/types/geo'
import type { TileCoordinate } from '@/services/nasa/marsTrekProvider'
import type { PoICategory } from '@/types/poi'

/**
 * Pure math for the 3D Mars globe. No three.js import here — per docs/ARCHITECTURE.md §1 the
 * science/math layer stays framework-free, which also keeps these helpers unit-testable in
 * jsdom.
 *
 * Sphere convention (verified against three r0.187 `SphereGeometry` source):
 *   theta = (90° − lat)   polar angle from +Y (north pole), 0..π
 *   phi   = (lon + 180°)  because SphereGeometry maps u = (lon + 180) / 360 onto
 *                         phi = u · 2π with vertex.x = −r·cos(phi)·sin(theta),
 *                         vertex.z = r·sin(phi)·sin(theta).
 *   UVs: uv.y = 1 − v and the default flipY texture upload places the image TOP at uv.y = 1,
 *   so an equirectangular canvas drawn with north at the top maps correctly.
 */

export interface Vec3 {
  x: number
  y: number
  z: number
}

const DEG = Math.PI / 180

/** Wrap a longitude into east-positive [−180, 180] (D-010 convention). */
export function wrapLon(deg: number): number {
  return ((((deg + 180) % 360) + 360) % 360) - 180
}

/**
 * Project a lat/lon onto a sphere of the given radius in three.js scene coordinates so that
 * the point sits exactly where the equirectangular texture renders it (see file header).
 */
export function latLonToSpherePosition(coord: LatLon, radius = 1): Vec3 {
  const theta = (90 - coord.lat) * DEG
  const phi = (coord.lon + 180) * DEG
  const sinTheta = Math.sin(theta)
  return {
    x: -radius * Math.cos(phi) * sinTheta,
    y: radius * Math.cos(theta),
    z: radius * Math.sin(phi) * sinTheta,
  }
}

/** Inverse of {@link latLonToSpherePosition} — used for the cursor lat/lon readout. */
export function spherePositionToLatLon(p: Vec3): LatLon {
  const r = Math.hypot(p.x, p.y, p.z)
  if (r === 0) return { lat: 0, lon: 0 }
  const lat = 90 - Math.acos(Math.min(1, Math.max(-1, p.y / r))) / DEG
  const phi = Math.atan2(p.z, -p.x) / DEG // [−180, 180]
  return { lat, lon: wrapLon(phi - 180) }
}

/**
 * WMTS tile grid for a zoom level. Mars equirectangular layers use a 2:1 tile pyramid:
 * zoom 0 → 2 cols × 1 row (verified live in Phase 1 — the dashboard strip consumes it).
 */
export function tileGridForZoom(zoom: number): { cols: number; rows: number } {
  return { cols: 2 ** (zoom + 1), rows: 2 ** zoom }
}

/** Row-major list of every tile coordinate at a zoom level. */
export function listTilesForZoom(zoom: number): TileCoordinate[] {
  const { cols, rows } = tileGridForZoom(zoom)
  const tiles: TileCoordinate[] = []
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) tiles.push({ z: zoom, x, y })
  }
  return tiles
}

export type GlobeTierId = 'low' | 'medium' | 'high'

export interface GlobeTier {
  id: GlobeTierId
  label: string
  /** WMTS zoom used to compose the mosaic texture (verified global layers only). */
  mosaicZoom: number
  /** Sphere geometry subdivisions [widthSegments, heightSegments]. */
  segments: [number, number]
  /** devicePixelRatio cap for the WebGL canvas. */
  dprCap: number
  /** Composed texture size in px (for UI display). */
  textureWidth: number
  textureHeight: number
  tileCount: number
}

/**
 * Quality tiers (DEVELOPMENT_ROADMAP Phase 2). Texture = client-side composite of verified
 * Trek WMTS tiles, so tier drives request count: low 8 tiles, medium 32, high 128.
 */
export const GLOBE_TIERS: Record<GlobeTier['id'], GlobeTier> = {
  low: {
    id: 'low',
    label: 'Low',
    mosaicZoom: 1,
    segments: [48, 32],
    dprCap: 1,
    textureWidth: 1024,
    textureHeight: 512,
    tileCount: 8,
  },
  medium: {
    id: 'medium',
    label: 'Medium',
    mosaicZoom: 2,
    segments: [80, 56],
    dprCap: 1.5,
    textureWidth: 2048,
    textureHeight: 1024,
    tileCount: 32,
  },
  high: {
    id: 'high',
    label: 'High',
    mosaicZoom: 3,
    segments: [128, 96],
    dprCap: 2,
    textureWidth: 4096,
    textureHeight: 2048,
    tileCount: 128,
  },
}

export const GLOBE_TIER_ORDER: GlobeTier['id'][] = ['low', 'medium', 'high']

/** Drop one tier from a given id (no-op at low). */
export function oneTierLower(id: GlobeTier['id']): GlobeTier['id'] {
  const index = GLOBE_TIER_ORDER.indexOf(id)
  return GLOBE_TIER_ORDER[Math.max(0, index - 1)]
}

/** Auto-quality rule: sustained FPS below this downgrades one tier (never upgrades). */
export const AUTO_DOWNGRADE_FPS = 28

/**
 * Pure decision for adaptive quality: downgrade when the rolling FPS average stays below
 * {@link AUTO_DOWNGRADE_FPS}. Only ever downgrades — upgrading mid-session would surprise
 * users with a large texture refetch.
 */
export function shouldDowngradeTier(
  rollingAvgFps: number,
  current: GlobeTier['id'],
  autoQuality: boolean,
): boolean {
  return autoQuality && rollingAvgFps > 0 && rollingAvgFps < AUTO_DOWNGRADE_FPS && current !== 'low'
}

/**
 * Graticule polylines for the lat/lon grid. Points are on the sphere surface (slightly above,
 * `radiusOffset`, to avoid z-fighting with the globe mesh).
 */
export interface GraticuleData {
  /** Parallels and meridians drawn in the regular (faint) style. */
  regular: Vec3[][]
  /** Equator and prime meridian, drawn stronger. */
  highlights: Vec3[][]
}

export function graticulePolylines(stepDeg = 15, radius = 1, radiusOffset = 0.002): GraticuleData {
  const r = radius + radiusOffset
  const sample = (lat: number, lon: number): Vec3 => latLonToSpherePosition({ lat, lon }, r)
  const regular: Vec3[][] = []
  const highlights: Vec3[][] = []

  // Parallels from −75° to +75° (poles excluded), lon sampled every 5° for smooth arcs.
  for (let lat = -75; lat <= 75; lat += stepDeg) {
    const line: Vec3[] = []
    for (let lon = -180; lon <= 180; lon += 5) line.push(sample(lat, lon))
    if (lat === 0) highlights.push(line)
    else regular.push(line)
  }
  // Meridians every stepDeg; lon 0 is the prime meridian highlight.
  for (let lon = -180; lon < 180; lon += stepDeg) {
    const line: Vec3[] = []
    for (let lat = -90; lat <= 90; lat += 5) line.push(sample(lat, lon))
    if (lon === 0) highlights.push(line)
    else regular.push(line)
  }
  return { regular, highlights }
}

/*
 * 3D material colors. These mirror the design tokens in `styles/globals.css` `@theme`
 * (three.js materials cannot read CSS custom properties); keep in sync when tokens change.
 * The atmosphere constants are an ILLUSTRATIVE visual approximation — Mars' atmosphere is
 * thin; values chosen for limb legibility, not radiative transfer (docs/SCIENTIFIC_MODELS.md).
 */
export const GLOBE_MATERIAL_COLORS = {
  /** Marker colors by POI category. */
  markers: {
    'landing-site': '#e56b3f', // accent
    mission: '#53d6e8', // cyan
    geology: '#fbbf24', // amber
    region: '#f5f7fa', // ink
    fiction: '#f87171', // danger
  } satisfies Record<PoICategory, string>,
  /** Globe base while its texture has not arrived. */
  fallbackSurface: '#161e2d', // surface-2
  /** Dark underlay painted behind failed tiles in a degraded mosaic. */
  missingTile: '#10151f',
  /** Graticule lines. */
  grid: '#53d6e8', // cyan
  gridHighlight: '#e56b3f', // accent
  /** Atmosphere rim (illustrative). */
  atmosphereInner: '#d9a06b', // dusty butterscotch limb
  atmosphereOuter: '#3f6f9e', // faint cool scatter hint
  atmosphereIntensity: 0.55,
} as const

/** Camera defaults: the planet opens centered on Jezero — ARES' first explorable region. */
export const GLOBE_INITIAL_FOCUS: LatLon = { lat: 18.44, lon: 77.45 }
export const GLOBE_INITIAL_DISTANCE = 2.8
export const GLOBE_FLY_TO_DISTANCE = 2.25
/** radians/second for the idle spin (paused on selection / reduced motion). */
export const GLOBE_IDLE_SPIN = 0.02
