import { describe, expect, it } from 'vitest'
import {
  assessCellRisk,
  explainCellRisk,
  getProfileById,
  MOBILITY_PROFILES,
  scoreToSeverity,
} from './riskModel'

describe('mobility profiles', () => {
  it('provides three built-in profiles', () => {
    expect(MOBILITY_PROFILES.length).toBe(3)
    expect(MOBILITY_PROFILES.map((p) => p.id)).toEqual(['conservative', 'standard', 'capable'])
  })

  it('weights sum to 1 for every profile', () => {
    for (const p of MOBILITY_PROFILES) {
      const sum = p.weights.slope + p.weights.roughness + p.weights.relief
      expect(sum).toBeCloseTo(1, 5)
    }
  })

  it('fallbacks to standard for unknown ids', () => {
    expect(getProfileById('nonexistent').id).toBe('standard')
  })
})

describe('assessCellRisk', () => {
  const standard = getProfileById('standard')

  it('returns unknown for invalid cells', () => {
    const r = assessCellRisk(10, 2, 5, false, standard)
    expect(r.severity).toBe('unknown')
    expect(r.category).toBe('uncertain_data')
  })

  it('returns low for flat, smooth terrain', () => {
    const r = assessCellRisk(2, 1, 5, true, standard)
    expect(r.severity).toBe('low')
    expect(r.score).toBe(0)
  })

  it('classifies steep slopes', () => {
    const r = assessCellRisk(31, 1, 5, true, standard)
    expect(r.category).toBe('very_steep')
    expect(r.severity).toBeOneOf(['high', 'critical'])
  })

  it('classifies high roughness', () => {
    const r = assessCellRisk(5, 18, 5, true, standard)
    expect(r.category).toBe('high_roughness')
    expect(r.contributions.roughness).toBeGreaterThan(0)
  })

  it('classifies high relief', () => {
    const r = assessCellRisk(5, 1, 60, true, standard)
    expect(r.category).toBe('high_relief')
    expect(r.contributions.relief).toBeGreaterThan(0)
  })
})

describe('scoreToSeverity', () => {
  it('maps scores to the expected severity bands', () => {
    expect(scoreToSeverity(0)).toBe('low')
    expect(scoreToSeverity(0.24)).toBe('low')
    expect(scoreToSeverity(0.25)).toBe('moderate')
    expect(scoreToSeverity(0.5)).toBe('high')
    expect(scoreToSeverity(0.75)).toBe('critical')
    expect(scoreToSeverity(1)).toBe('critical')
  })
})

describe('explainCellRisk', () => {
  const standard = getProfileById('standard')

  it('explains unknown cells', () => {
    const r = assessCellRisk(0, 0, 0, false, standard)
    expect(explainCellRisk(r, standard)).toContain('No valid DEM data')
  })

  it('explains low risk', () => {
    const r = assessCellRisk(2, 1, 5, true, standard)
    expect(explainCellRisk(r, standard)).toContain('Below')
  })

  it('mentions slope for steep terrain', () => {
    const r = assessCellRisk(30, 1, 5, true, standard)
    const text = explainCellRisk(r, standard)
    expect(text).toContain('slope')
    expect(text).toContain('standard')
  })
})
