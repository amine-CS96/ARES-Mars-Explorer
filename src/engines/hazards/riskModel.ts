/**
 * Transparent, configurable terrain-risk model for the ARES Hazards module.
 *
 * The model is intentionally separated from the data so users can see exactly which assumptions
 * change when they switch mobility profiles. Scores are planning estimates, not official NASA
 * traversability certifications.
 */

export type Severity = 'low' | 'moderate' | 'high' | 'critical' | 'unknown'
export type HazardCategory =
  | 'steep_slope'
  | 'very_steep'
  | 'high_roughness'
  | 'high_relief'
  | 'uncertain_data'
  | 'none'

export interface MobilityProfile {
  id: string
  name: string
  description: string
  /** Slope above which terrain is considered a moderate hazard (degrees). */
  slopeModerateDeg: number
  /** Slope above which terrain is considered a steep hazard (degrees). */
  slopeSteepDeg: number
  /** Slope above which terrain is considered critically steep (degrees). */
  slopeCriticalDeg: number
  /** Local elevation standard deviation above which terrain is flagged as rough (meters). */
  roughnessThresholdM: number
  /** Local relief above which terrain is flagged as high-relief (meters). */
  reliefThresholdM: number
  /**
   * Maximum slope the profile can traverse. Used for route planning constraints and to label
   * terrain as impassable for this profile.
   */
  maxTraversableSlopeDeg: number
  /** Weights for the combined risk score. Must sum to 1 for interpretability. */
  weights: {
    slope: number
    roughness: number
    relief: number
  }
}

export const SEVERITY_ORDER: Severity[] = ['low', 'moderate', 'high', 'critical', 'unknown']

export const SEVERITY_COLORS: Record<Severity, string> = {
  low: '#34d399',
  moderate: '#fbbf24',
  high: '#e56b3f',
  critical: '#f87171',
  unknown: '#6b7a94',
}

export const SEVERITY_LABELS: Record<Severity, string> = {
  low: 'Low',
  moderate: 'Moderate',
  high: 'High',
  critical: 'Critical',
  unknown: 'Unknown',
}

export const CATEGORY_LABELS: Record<HazardCategory, string> = {
  steep_slope: 'Steep slope',
  very_steep: 'Very steep / impassable',
  high_roughness: 'High roughness',
  high_relief: 'High local relief',
  uncertain_data: 'Uncertain / missing data',
  none: 'No significant hazard',
}

export const CATEGORY_COLORS: Record<HazardCategory, string> = {
  steep_slope: '#fbbf24',
  very_steep: '#f87171',
  high_roughness: '#a78bfa',
  high_relief: '#53d6e8',
  uncertain_data: '#6b7a94',
  none: '#34d399',
}

/** Educational mobility profiles. These are planning assumptions, not actual NASA specs. */
export const MOBILITY_PROFILES: MobilityProfile[] = [
  {
    id: 'conservative',
    name: 'Conservative rover',
    description: 'Assumes limited slope capability and low tolerance for broken ground.',
    slopeModerateDeg: 10,
    slopeSteepDeg: 20,
    slopeCriticalDeg: 25,
    roughnessThresholdM: 6,
    reliefThresholdM: 25,
    maxTraversableSlopeDeg: 25,
    weights: { slope: 0.6, roughness: 0.25, relief: 0.15 },
  },
  {
    id: 'standard',
    name: 'Standard explorer',
    description: 'Balanced profile suitable for general route planning over the Jezero CTX DEM.',
    slopeModerateDeg: 15,
    slopeSteepDeg: 25,
    slopeCriticalDeg: 30,
    roughnessThresholdM: 10,
    reliefThresholdM: 40,
    maxTraversableSlopeDeg: 30,
    weights: { slope: 0.55, roughness: 0.25, relief: 0.2 },
  },
  {
    id: 'capable',
    name: 'Capable traverse',
    description: 'More permissive profile for scouting routes in difficult but not extreme terrain.',
    slopeModerateDeg: 20,
    slopeSteepDeg: 30,
    slopeCriticalDeg: 35,
    roughnessThresholdM: 14,
    reliefThresholdM: 60,
    maxTraversableSlopeDeg: 35,
    weights: { slope: 0.5, roughness: 0.3, relief: 0.2 },
  },
]

export function getProfileById(id: string): MobilityProfile {
  return MOBILITY_PROFILES.find((p) => p.id === id) ?? MOBILITY_PROFILES[1]
}

/**
 * Map a value above a threshold to a 0–1 score using a smooth ramp.
 * At the threshold the score is 0; it approaches 1 as the value doubles the threshold.
 */
function ramp(value: number, threshold: number): number {
  if (threshold <= 0 || value <= threshold) return 0
  const ratio = (value - threshold) / threshold
  return Math.min(1, ratio)
}

export interface FactorContributions {
  /** Raw 0–1 ramp score per factor. */
  slope: number
  roughness: number
  relief: number
  /** Weighted contribution per factor (ramp × weight). Sums to the combined score. */
  weighted: {
    slope: number
    roughness: number
    relief: number
  }
  /** Combined 0–1 score (sum of weighted contributions). */
  score: number
}

/**
 * Compute per-factor ramp and weighted contributions for arbitrary terrain values against a
 * profile. Uses exactly the same ramp math as `assessCellRisk`, so numbers shown in the UI are
 * the model's real math — no invented percentages.
 */
export function computeFactorContributions(
  slopeDeg: number,
  roughnessM: number,
  reliefM: number,
  profile: MobilityProfile,
): FactorContributions {
  const slope = ramp(slopeDeg, profile.slopeModerateDeg)
  const roughness = ramp(roughnessM, profile.roughnessThresholdM)
  const relief = ramp(reliefM, profile.reliefThresholdM)
  const weighted = {
    slope: slope * profile.weights.slope,
    roughness: roughness * profile.weights.roughness,
    relief: relief * profile.weights.relief,
  }
  return {
    slope,
    roughness,
    relief,
    weighted,
    score: weighted.slope + weighted.roughness + weighted.relief,
  }
}

export interface CellRisk {
  /** Individual category with the highest contribution. */
  category: HazardCategory
  /** Combined 0–1 risk score. */
  score: number
  /** Final severity class. */
  severity: Severity
  /** Per-input fractional contributions (for explanations). */
  contributions: {
    slope: number
    roughness: number
    relief: number
  }
}

/**
 * Assess a single cell against a mobility profile.
 *
 * Returns `unknown` severity for invalid/nodata cells. Otherwise computes a weighted score from
 * slope, roughness, and relief. The dominant category is the input that contributes most to the
 * score.
 */
export function assessCellRisk(
  slopeDeg: number,
  roughnessM: number,
  reliefM: number,
  valid: boolean,
  profile: MobilityProfile,
): CellRisk {
  if (!valid || !Number.isFinite(slopeDeg)) {
    return {
      category: 'uncertain_data',
      score: 0,
      severity: 'unknown',
      contributions: { slope: 0, roughness: 0, relief: 0 },
    }
  }

  let category: HazardCategory = 'none'
  if (slopeDeg >= profile.slopeCriticalDeg) {
    category = 'very_steep'
  } else if (slopeDeg >= profile.slopeSteepDeg) {
    category = 'steep_slope'
  } else if (roughnessM >= profile.roughnessThresholdM) {
    category = 'high_roughness'
  } else if (reliefM >= profile.reliefThresholdM) {
    category = 'high_relief'
  }

  const slopeScore = ramp(slopeDeg, profile.slopeModerateDeg)
  const roughnessScore = ramp(roughnessM, profile.roughnessThresholdM)
  const reliefScore = ramp(reliefM, profile.reliefThresholdM)

  const score =
    profile.weights.slope * slopeScore +
    profile.weights.roughness * roughnessScore +
    profile.weights.relief * reliefScore

  const severity = scoreToSeverity(score)

  return {
    category,
    score,
    severity,
    contributions: {
      slope: slopeScore,
      roughness: roughnessScore,
      relief: reliefScore,
    },
  }
}

export function scoreToSeverity(score: number): Severity {
  if (score >= 0.75) return 'critical'
  if (score >= 0.5) return 'high'
  if (score >= 0.25) return 'moderate'
  return 'low'
}

/**
 * Explain why a cell received its risk classification in plain language.
 */
export function explainCellRisk(risk: CellRisk, profile: MobilityProfile): string {
  if (risk.severity === 'unknown') {
    return 'No valid DEM data at this location. The cell is treated as unknown, not safe.'
  }
  if (risk.severity === 'low') {
    return `Below the ${profile.name.toLowerCase()} thresholds for slope, roughness, and relief.`
  }

  const parts: string[] = []
  if (risk.contributions.slope > 0) parts.push('slope')
  if (risk.contributions.roughness > 0) parts.push('roughness')
  if (risk.contributions.relief > 0) parts.push('local relief')
  const drivers = parts.length > 0 ? parts.join(' + ') : 'terrain factors'
  return `${SEVERITY_LABELS[risk.severity]} risk driven primarily by ${drivers} under the ${profile.name.toLowerCase()} profile.`
}
