import type { TerrainAnalysis } from './terrainAnalysis'
import { assessCellRisk, type MobilityProfile } from './riskModel'

/**
 * Profile-level accessibility summary over the analyzed DEM.
 *
 * Answers "how much of the analyzed terrain is restricted for this profile" using the same
 * per-cell classification as the hazard model — no separate or invented thresholds.
 */

export interface ProfileAccessibility {
  /** Profile the summary was computed for. */
  profileId: string
  /** Fraction [0–1] of valid cells classified moderate or higher (restricted). */
  restrictedFraction: number
  /** Fraction [0–1] of valid cells classified low (accessible by this model). */
  accessibleFraction: number
  /** Count of valid cells classified moderate or higher. */
  restrictedCells: number
  /** Count of valid cells classified low. */
  accessibleCells: number
  /** Total valid cells considered. */
  validCells: number
}

export function computeProfileAccessibility(
  analysis: TerrainAnalysis,
  profile: MobilityProfile,
): ProfileAccessibility {
  const { width, height, valid, slope, roughness, relief } = analysis
  let validCells = 0
  let restrictedCells = 0
  let accessibleCells = 0

  for (let i = 0; i < width * height; i++) {
    if (valid[i] !== 1) continue
    validCells++
    const r = assessCellRisk(slope[i], roughness[i], relief[i], true, profile)
    if (r.severity === 'low') accessibleCells++
    else restrictedCells++
  }

  const restrictedFraction = validCells > 0 ? restrictedCells / validCells : 0
  const accessibleFraction = validCells > 0 ? accessibleCells / validCells : 0

  return {
    profileId: profile.id,
    restrictedFraction,
    accessibleFraction,
    restrictedCells,
    accessibleCells,
    validCells,
  }
}

/** Accessibility summaries for every mobility profile, in MOBILITY_PROFILES order. */
export function computeAllProfileAccessibility(
  analysis: TerrainAnalysis,
  profiles: MobilityProfile[],
): ProfileAccessibility[] {
  return profiles.map((p) => computeProfileAccessibility(analysis, p))
}
