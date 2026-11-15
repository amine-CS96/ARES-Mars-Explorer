import { describe, expect, it } from 'vitest'
import { parseElevationMetadata } from './terrainGrid'

const validMetadata = {
  elevation: { minMeters: -2710.7, maxMeters: -1515.54, kind: 'measured' },
  bbox: { west: 77.160465, south: 18.211027, east: 77.698975, north: 18.721194 },
  product: { width: 1596, height: 1512 },
}

describe('parseElevationMetadata', () => {
  it('accepts valid pipeline metadata', () => {
    const parsed = parseElevationMetadata(validMetadata)
    expect(parsed.elevation.minMeters).toBe(-2710.7)
    expect(parsed.bbox.north).toBe(18.721194)
    expect(parsed.product?.width).toBe(1596)
  })

  it('rejects non-object payloads (e.g. HTML served as a 200 response)', () => {
    expect(() => parseElevationMetadata(null)).toThrow(/not a JSON object/)
    expect(() => parseElevationMetadata('error page')).toThrow(/not a JSON object/)
    expect(() => parseElevationMetadata(undefined)).toThrow(/not a JSON object/)
  })

  it('rejects missing or inverted elevation ranges', () => {
    expect(() =>
      parseElevationMetadata({
        ...validMetadata,
        elevation: { ...validMetadata.elevation, minMeters: Number.NaN },
      }),
    ).toThrow(/invalid elevation range/)
    expect(() =>
      parseElevationMetadata({
        ...validMetadata,
        elevation: { ...validMetadata.elevation, minMeters: -1000, maxMeters: -2000 },
      }),
    ).toThrow(/invalid elevation range/)
    expect(() =>
      parseElevationMetadata({ ...validMetadata, elevation: undefined }),
    ).toThrow(/invalid elevation range/)
  })

  it('rejects invalid geographic bboxes', () => {
    expect(() =>
      parseElevationMetadata({ ...validMetadata, bbox: undefined }),
    ).toThrow(/invalid geographic bbox/)
    expect(() =>
      parseElevationMetadata({
        ...validMetadata,
        bbox: { west: Number.NaN, south: 0, east: 1, north: 1 },
      }),
    ).toThrow(/invalid geographic bbox/)
    expect(() =>
      parseElevationMetadata({
        ...validMetadata,
        bbox: { west: 10, south: 0, east: 5, north: 1 },
      }),
    ).toThrow(/invalid geographic bbox/)
  })
})
