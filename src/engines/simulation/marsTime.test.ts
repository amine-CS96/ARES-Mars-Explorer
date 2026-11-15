import { describe, expect, it } from 'vitest'
import { formatHours, marsTime, solarElevation } from './marsTime'

describe('marsTime', () => {
  it('matches Mars24 near-coincident Earth/Mars time example', () => {
    // 2000-01-06T00:00:00Z, lon 0°W, lat 0°N
    const date = new Date(Date.UTC(2000, 0, 6, 0, 0, 0))
    const t = marsTime(date, 0, 0)
    expect(t.lsDegrees).toBeCloseTo(277.18758, 1)
    expect(t.mstHours).toBeCloseTo(23.99425, 3)
    expect(t.lmstHours).toBeCloseTo(23.99425, 3)
    expect(t.ltstHours).toBeCloseTo(23.6484, 3)
    expect(t.eotDegrees).toBeCloseTo(-5.18774, 2)
    expect(t.subsolarLongitude).toBeCloseTo(174.726, 1)
    expect(t.solarDeclination).toBeCloseTo(-25.22825, 1)
    expect(t.heliocentricDistanceAu).toBeCloseTo(1.39358, 3)
  })

  it('matches Mars24 Spirit landing example', () => {
    // MER-A Spirit landing: 2004-01-04T13:46:31Z, 184.702°W, -14.640°N
    // The algorithm page uses the local-true-midnight prior to touchdown, which is
    // 2004-01-03T13:46:31Z. We use that exact timestamp.
    const date = new Date(Date.UTC(2004, 0, 3, 13, 46, 31))
    const t = marsTime(date, 184.702, -14.64)
    expect(t.lsDegrees).toBeCloseTo(327.32416, 1)
    expect(t.mstHours).toBeCloseTo(13.16537, 3)
    expect(t.lmstHours).toBeCloseTo(0.8519, 3)
    expect(t.ltstHours).toBeCloseTo(0.00025, 3)
    expect(t.eotDegrees).toBeCloseTo(-12.77553, 2)
    expect(t.subsolarLongitude).toBeCloseTo(4.705, 1)
  })

  it('places the sun below the horizon at local true midnight for Spirit', () => {
    // Local true midnight ~ LTST ≈ 0; the subsolar point is on the opposite side of Mars.
    const date = new Date(Date.UTC(2004, 0, 3, 13, 46, 31))
    const t = marsTime(date, 184.702, -14.64)
    const elev = solarElevation(t, 184.702, -14.64)
    expect(elev).toBeLessThan(-30)
  })

  it('formats hours as HH:MM:SS', () => {
    expect(formatHours(23.99425)).toBe('23:59:39')
    expect(formatHours(0.8519)).toBe('00:51:06')
  })
})
