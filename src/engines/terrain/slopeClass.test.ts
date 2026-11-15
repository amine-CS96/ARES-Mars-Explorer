import { describe, expect, it } from 'vitest'
import { slopeClass, SLOPE_CLASS_COLORS, SLOPE_THRESHOLDS_DEG } from './slopeClass'

describe('slopeClass', () => {
  it('classifies flat below 5°', () => {
    expect(slopeClass(0).key).toBe('flat')
    expect(slopeClass(4.9).key).toBe('flat')
  })

  it('classifies moderate from 5° to 15°', () => {
    expect(slopeClass(5).key).toBe('moderate')
    expect(slopeClass(14.9).key).toBe('moderate')
  })

  it('classifies steep from 15° to 25°', () => {
    expect(slopeClass(15).key).toBe('steep')
    expect(slopeClass(24.9).key).toBe('steep')
  })

  it('classifies hazardous at 25° and above', () => {
    expect(slopeClass(25).key).toBe('hazardous')
    expect(slopeClass(45).key).toBe('hazardous')
  })

  it('uses signed magnitude', () => {
    expect(slopeClass(-20).key).toBe('steep')
  })

  it('exports a color for every class', () => {
    expect(SLOPE_CLASS_COLORS.flat).toBeDefined()
    expect(SLOPE_CLASS_COLORS.moderate).toBeDefined()
    expect(SLOPE_CLASS_COLORS.steep).toBeDefined()
    expect(SLOPE_CLASS_COLORS.hazardous).toBeDefined()
  })

  it('thresholds match documentation', () => {
    expect(SLOPE_THRESHOLDS_DEG.flat).toBe(5)
    expect(SLOPE_THRESHOLDS_DEG.moderate).toBe(15)
    expect(SLOPE_THRESHOLDS_DEG.steep).toBe(25)
  })
})
