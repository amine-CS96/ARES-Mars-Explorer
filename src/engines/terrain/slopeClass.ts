/**
 * Terrain slope classification used across ARES.
 *
 * Thresholds are documented in docs/SCIENTIFIC_MODELS.md §6. They are planning aids, not
 * certified traversability rulings. A cell labeled hazardous simply means the regional DEM
 * indicates a slope above the chosen threshold; rocks smaller than the DEM resolution are not
 * resolved.
 */

export type SlopeClassKey = 'flat' | 'moderate' | 'steep' | 'hazardous'

export interface SlopeClass {
  key: SlopeClassKey
  label: string
  thresholdDegrees: number
}

export const SLOPE_THRESHOLDS_DEG = {
  flat: 5,
  moderate: 15,
  steep: 25,
} as const

export const SLOPE_CLASS_COLORS: Record<SlopeClassKey, string> = {
  flat: '#34d399',
  moderate: '#fbbf24',
  steep: '#e56b3f',
  hazardous: '#f87171',
}

export function slopeClass(degrees: number): SlopeClass {
  const absDeg = Math.abs(degrees)
  if (absDeg < SLOPE_THRESHOLDS_DEG.flat) {
    return { key: 'flat', label: 'Flat to gently sloping', thresholdDegrees: SLOPE_THRESHOLDS_DEG.flat }
  }
  if (absDeg < SLOPE_THRESHOLDS_DEG.moderate) {
    return { key: 'moderate', label: 'Moderate slope', thresholdDegrees: SLOPE_THRESHOLDS_DEG.moderate }
  }
  if (absDeg < SLOPE_THRESHOLDS_DEG.steep) {
    return { key: 'steep', label: 'Steep slope', thresholdDegrees: SLOPE_THRESHOLDS_DEG.steep }
  }
  return { key: 'hazardous', label: 'Hazardous / impassable', thresholdDegrees: SLOPE_THRESHOLDS_DEG.steep }
}

export function slopeClassFromKey(key: SlopeClassKey): SlopeClass {
  switch (key) {
    case 'flat':
      return slopeClass(0)
    case 'moderate':
      return slopeClass(SLOPE_THRESHOLDS_DEG.flat)
    case 'steep':
      return slopeClass(SLOPE_THRESHOLDS_DEG.moderate)
    case 'hazardous':
    default:
      return slopeClass(SLOPE_THRESHOLDS_DEG.steep)
  }
}
