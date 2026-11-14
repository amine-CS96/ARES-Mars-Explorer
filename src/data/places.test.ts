import { describe, expect, it } from 'vitest'
import { featuredPlaces, getPlaceById, places } from './places'
import { datasets } from './datasets'
import { isValidLatLon } from '@/utils/geo'

describe('places catalog integrity', () => {
  it('parses all entries against the zod schema (import-time guarantee)', () => {
    expect(places.length).toBeGreaterThan(5)
  })

  it('has unique ids', () => {
    const ids = new Set(places.map((p) => p.id))
    expect(ids.size).toBe(places.length)
  })

  it('every entry carries at least one source', () => {
    for (const place of places) {
      expect(place.sources.length).toBeGreaterThanOrEqual(1)
      for (const source of place.sources) {
        expect(source.label.length).toBeGreaterThan(3)
        if (source.url) {
          expect(source.url).toMatch(/^https?:\/\//)
        }
      }
    }
  })

  it('coordinates are valid and labeled for accuracy', () => {
    for (const place of places) {
      expect(isValidLatLon(place.coordinates)).toBe(true)
      expect(['verified', 'approximate', 'illustrative']).toContain(place.accuracy)
    }
  })

  it('fiction entries are exactly the illustrative ones', () => {
    for (const place of places) {
      if (place.accuracy === 'illustrative') {
        expect(place.category).toBe('fiction')
      }
      if (place.category === 'fiction') {
        expect(place.accuracy).toBe('illustrative')
      }
    }
  })

  it('verified entries cite an institutional source (NASA/JPL/USGS/MMGIS)', () => {
    for (const place of places.filter((p) => p.accuracy === 'verified')) {
      const labels = place.sources.map((s) => s.label).join(' ')
      expect(labels).toMatch(/NASA|USGS|MMGIS|Gazetteer/)
    }
  })

  it('exposes featured places for the dashboard', () => {
    expect(featuredPlaces.length).toBeGreaterThanOrEqual(4)
    expect(featuredPlaces.every((p) => p.featured)).toBe(true)
  })

  it('getPlaceById resolves known ids only', () => {
    expect(getPlaceById('octavia-e-butler-landing')?.name).toContain('Octavia')
    expect(getPlaceById('does-not-exist')).toBeUndefined()
  })
})

describe('dataset registry integrity', () => {
  it('has unique ids and valid phase references', () => {
    const ids = new Set(datasets.map((d) => d.id))
    expect(ids.size).toBe(datasets.length)
    for (const dataset of datasets) {
      expect(dataset.phase).toBeGreaterThanOrEqual(1)
      expect(dataset.phase).toBeLessThanOrEqual(6)
      expect(dataset.credit.length).toBeGreaterThan(3)
    }
  })

  it('available datasets document their verification, pending ones explain why', () => {
    for (const dataset of datasets) {
      if (dataset.status === 'available' || dataset.status === 'pending-verification') {
        expect(dataset.notes).toBeTruthy()
      }
    }
  })
})
