import { describe, expect, it } from 'vitest'
import {
  formatLatLon,
  haversineDistanceKm,
  isValidLatLon,
  lon180to360,
  lon360to180,
} from './geo'

describe('lon conversion', () => {
  it('converts 0–360°E convention to ±180 (D-010)', () => {
    expect(lon360to180(226.2)).toBeCloseTo(-133.8, 6) // Olympus Mons per USGS Gazetteer
    expect(lon360to180(77.4508)).toBeCloseTo(77.4508, 6)
    expect(lon360to180(0)).toBe(0)
    expect(lon360to180(180)).toBe(-180)
  })

  it('round-trips east-positive longitudes', () => {
    for (const lon of [0, 45, 77.45, 133.8, -133.8, 179.99, -179.99, 226.2]) {
      expect(lon180to360(lon360to180(lon))).toBeCloseTo(((lon % 360) + 360) % 360, 6)
    }
  })
})

describe('haversineDistanceKm (Mars radius)', () => {
  // Published Perseverance traverse anchors (MMGIS/PDS, see src/data/places.ts).
  const octavia = { lat: 18.4447, lon: 77.4508 }
  const threeForks = { lat: 18.4528, lon: 77.4082 }

  it('Octavia E. Butler Landing → Three Forks ≈ 2.4 km on the Martian sphere', () => {
    const d = haversineDistanceKm(octavia, threeForks)
    // Independent check: Δlon 0.0426° × (π/180 × 3389.5 km) × cos(18.45°) ≈ 2.39 km,
    // Δlat 0.0081° ≈ 0.48 km → ≈ 2.44 km. Tolerance ±0.5 km.
    expect(d).toBeGreaterThan(2.0)
    expect(d).toBeLessThan(2.9)
  })

  it('is symmetric and zero on identical points', () => {
    const a = { lat: 18.4, lon: 77.5 }
    expect(haversineDistanceKm(a, a)).toBeCloseTo(0, 9)
    expect(haversineDistanceKm(a, threeForks)).toBeCloseTo(
      haversineDistanceKm(threeForks, a),
      9,
    )
  })

  it('uses Mars, not Earth, scale (1° latitude ≈ 59.2 km)', () => {
    const oneDegree = haversineDistanceKm({ lat: 0, lon: 0 }, { lat: 1, lon: 0 })
    expect(oneDegree).toBeGreaterThan(58.5)
    expect(oneDegree).toBeLessThan(60.0)
  })
})

describe('formatLatLon', () => {
  it('formats decimal degrees with hemispheres', () => {
    expect(formatLatLon({ lat: 18.4447, lon: 77.4508 })).toBe('18.4447° N, 77.4508° E')
    expect(formatLatLon({ lat: -4.5895, lon: 137.4417 })).toBe('4.5895° S, 137.4417° E')
  })

  it('formats DMS', () => {
    expect(formatLatLon({ lat: 18.4447, lon: 77.4508 }, { dms: true })).toBe(
      '18°26′41″ N, 77°27′03″ E',
    )
  })

  it('honors the decimals option', () => {
    expect(formatLatLon({ lat: 18.4, lon: 77.5 }, { decimals: 2 })).toBe('18.40° N, 77.50° E')
  })
})

describe('isValidLatLon', () => {
  it('rejects out-of-range or non-finite values', () => {
    expect(isValidLatLon({ lat: 90, lon: 180 })).toBe(true)
    expect(isValidLatLon({ lat: 90.1, lon: 0 })).toBe(false)
    expect(isValidLatLon({ lat: 0, lon: -180.1 })).toBe(false)
    expect(isValidLatLon({ lat: Number.NaN, lon: 0 })).toBe(false)
  })
})
