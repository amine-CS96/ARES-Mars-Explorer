import { describe, expect, it } from 'vitest'
import { places } from '@/data/places'
import {
  AUTO_DOWNGRADE_FPS,
  GLOBE_TIERS,
  graticulePolylines,
  latLonToSpherePosition,
  listTilesForZoom,
  oneTierLower,
  shouldDowngradeTier,
  spherePositionToLatLon,
  tileGridForZoom,
} from './math'

describe('tile pyramid (verified 2:1 Mars EQ grid)', () => {
  it('zoom 0 is 2 cols × 1 row — matches the live-verified dashboard strip', () => {
    expect(tileGridForZoom(0)).toEqual({ cols: 2, rows: 1 })
  })

  it('zoom 3 is 16 cols × 8 rows (128 tiles) for the high tier', () => {
    expect(tileGridForZoom(3)).toEqual({ cols: 16, rows: 8 })
    const tiles = listTilesForZoom(3)
    expect(tiles).toHaveLength(128)
    expect(tiles[0]).toEqual({ z: 3, x: 0, y: 0 })
    expect(tiles[127]).toEqual({ z: 3, x: 15, y: 7 })
  })

  it('tier configs agree with their zoom tile counts', () => {
    for (const tier of Object.values(GLOBE_TIERS)) {
      const { cols, rows } = tileGridForZoom(tier.mosaicZoom)
      expect(cols * rows).toBe(tier.tileCount)
      expect(tier.textureWidth).toBe(256 * cols)
      expect(tier.textureHeight).toBe(256 * rows)
    }
  })
})

describe('lat/lon → sphere projection', () => {
  it('maps poles onto the ±Y axis', () => {
    const north = latLonToSpherePosition({ lat: 90, lon: 0 })
    const south = latLonToSpherePosition({ lat: -90, lon: 0 })
    expect(north.y).toBeCloseTo(1, 12)
    expect(north.x).toBeCloseTo(0, 12)
    expect(north.z).toBeCloseTo(0, 12)
    expect(south.y).toBeCloseTo(-1, 12)
  })

  it('lat 0 / lon 0 lands at +X (u = 0.5 → phi = π in SphereGeometry)', () => {
    const p = latLonToSpherePosition({ lat: 0, lon: 0 })
    expect(p.x).toBeCloseTo(1, 12)
    expect(p.y).toBeCloseTo(0, 12)
    expect(p.z).toBeCloseTo(0, 12)
  })

  it('respects radius scaling', () => {
    const p = latLonToSpherePosition({ lat: 45, lon: 90 }, 3)
    expect(Math.hypot(p.x, p.y, p.z)).toBeCloseTo(3, 12)
  })

  it('round-trips every catalog POI coordinate within numerical tolerance', () => {
    for (const place of places) {
      const p = latLonToSpherePosition(place.coordinates)
      const back = spherePositionToLatLon(p)
      expect(back.lat).toBeCloseTo(place.coordinates.lat, 9)
      expect(back.lon).toBeCloseTo(place.coordinates.lon, 9)
    }
  })

  it('round-trips the poles (lat only — lon is degenerate there) and the antimeridian', () => {
    // At the poles every longitude collapses to one point; only latitude is meaningful.
    for (const coord of [
      { lat: 90, lon: 0 },
      { lat: -90, lon: 0 },
    ]) {
      const back = spherePositionToLatLon(latLonToSpherePosition(coord))
      expect(back.lat).toBeCloseTo(coord.lat, 9)
      expect(Math.abs(back.lon)).toBeLessThanOrEqual(180) // still a valid wrapped longitude
    }
    for (const coord of [
      { lat: 12, lon: 180 },
      { lat: 12, lon: -180 },
      { lat: -33, lon: 0.0001 },
      { lat: -33, lon: -0.0001 },
    ]) {
      const back = spherePositionToLatLon(latLonToSpherePosition(coord))
      expect(back.lat).toBeCloseTo(coord.lat, 9)
      if (Math.abs(coord.lon) === 180) {
        // The antimeridian has two valid representations (±180); accept either.
        expect(Math.abs(back.lon)).toBeCloseTo(180, 9)
      } else {
        expect(back.lon).toBeCloseTo(coord.lon, 9)
      }
    }
  })
})

describe('graticule builder', () => {
  it('produces 10 regular parallels + 23 regular meridians + 2 highlights', () => {
    const { regular, highlights } = graticulePolylines(15)
    // Parallels: −75..75 step 15 = 11 lines, equator moved to highlights → 10 regular.
    // Meridians: −180..165 step 15 = 24 lines, prime meridian highlighted → 23 regular.
    expect(regular).toHaveLength(10 + 23)
    expect(highlights).toHaveLength(2)
  })

  it('keeps every graticule point on the sphere surface (offset radius)', () => {
    const { regular, highlights } = graticulePolylines(15, 1, 0.002)
    for (const line of [...regular, ...highlights]) {
      for (const p of line) expect(Math.hypot(p.x, p.y, p.z)).toBeCloseTo(1.002, 12)
    }
  })
})

describe('adaptive quality decision', () => {
  it('downgrades on sustained low FPS when auto quality is on', () => {
    expect(shouldDowngradeTier(AUTO_DOWNGRADE_FPS - 5, 'medium', true)).toBe(true)
    expect(shouldDowngradeTier(AUTO_DOWNGRADE_FPS - 5, 'high', true)).toBe(true)
  })

  it('never acts at healthy FPS, when disabled, or already at low', () => {
    expect(shouldDowngradeTier(60, 'high', true)).toBe(false)
    expect(shouldDowngradeTier(20, 'high', false)).toBe(false)
    expect(shouldDowngradeTier(20, 'low', true)).toBe(false)
    expect(shouldDowngradeTier(0, 'high', true)).toBe(false) // no samples yet
  })

  it('oneTierLower walks toward low and stops there', () => {
    expect(oneTierLower('high')).toBe('medium')
    expect(oneTierLower('medium')).toBe('low')
    expect(oneTierLower('low')).toBe('low')
  })
})
