import { describe, expect, it } from 'vitest'
import { defaultMissionConfig } from './missionConfig'
import { estimateOxygen, pointOfNoReturn } from './oxygenModel'

describe('oxygenModel', () => {
  it('returns positive oxygen use for a realistic walk', () => {
    const config = defaultMissionConfig()
    const result = estimateOxygen(config)
    expect(result.totalEnergyJ).toBeGreaterThan(0)
    expect(result.oxygenMassKg).toBeGreaterThan(0)
    expect(result.availableMassKg).toBeGreaterThan(0)
  })

  it('increases oxygen use with steeper average grade', () => {
    const flat = estimateOxygen({ ...defaultMissionConfig(), elevationGainMeters: 0 })
    const hilly = estimateOxygen({ ...defaultMissionConfig(), elevationGainMeters: 500 })
    expect(hilly.totalEnergyJ).toBeGreaterThan(flat.totalEnergyJ)
  })

  it('flags NO-GO when the tank is too small', () => {
    const config = { ...defaultMissionConfig(), oxygenTankMassKg: 0.05 }
    const result = estimateOxygen(config)
    expect(result.remainingMassKg).toBeLessThan(0)
    expect(result.marginFraction).toBeLessThan(0)
  })

  it('point-of-no-return is zero when the walk cannot start and return', () => {
    const config = { ...defaultMissionConfig(), oxygenTankMassKg: 0.05 }
    const oxygen = estimateOxygen(config)
    const pnr = pointOfNoReturn(config, oxygen)
    expect(pnr.fraction).toBe(0)
  })

  it('point-of-no-return is one when the full round trip fits in reserve', () => {
    const config = { ...defaultMissionConfig(), oxygenTankMassKg: 10 }
    const oxygen = estimateOxygen(config)
    const pnr = pointOfNoReturn(config, oxygen)
    expect(pnr.fraction).toBe(1)
  })
})
