import { describe, expect, it } from 'vitest'
import {
  defaultCostParams,
  edgeEnergyJoules,
  gradePercentFromDegrees,
  metabolicPowerWatts,
  minEnergyPerMeter,
} from './costModel'

describe('costModel', () => {
  const params = defaultCostParams()

  it('returns positive energy for flat terrain', () => {
    const e = edgeEnergyJoules(0, 0, 10, params)
    expect(e).toBeGreaterThan(0)
  })

  it('costs more uphill than flat', () => {
    const flat = edgeEnergyJoules(0, 0, 10, params)
    const uphill = edgeEnergyJoules(0, 5, 10, params)
    expect(uphill).toBeGreaterThan(flat)
  })

  it('costs less downhill than uphill at the same grade magnitude', () => {
    const uphill = edgeEnergyJoules(0, 5, 10, params)
    const downhill = edgeEnergyJoules(5, 0, 10, params)
    expect(downhill).toBeLessThan(uphill)
  })

  it('grade conversion is exact for small angles', () => {
    expect(gradePercentFromDegrees(0)).toBeCloseTo(0, 5)
    expect(gradePercentFromDegrees(5.7106)).toBeCloseTo(10, 1)
  })

  it('metabolic power increases with positive grade', () => {
    const flat = metabolicPowerWatts(0, params)
    const steep = metabolicPowerWatts(20, params)
    expect(steep).toBeGreaterThan(flat)
  })

  it('minEnergyPerMeter is a lower bound', () => {
    const min = minEnergyPerMeter(params)
    const uphill = edgeEnergyJoules(0, 10, 1, params)
    expect(min).toBeLessThan(uphill)
  })
})
