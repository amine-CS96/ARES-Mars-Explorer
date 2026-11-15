/**
 * Surface radiation dose context for Mars EVA planning.
 *
 * Source: MSL RAD measured surface dose rate ≈ 0.64 mSv/day (Hassler et al., Science 2014).
 * This is a context number only, not a safety decision.
 */

/** MSL RAD surface dose rate in mSv per Martian sol (24.6229 h). */
export const RAD_SURFACE_DOSE_RATE_MSV_PER_SOL = 0.64

/** Commonly cited NASA astronaut career effective dose limit, mSv. */
export const CAREER_DOSE_LIMIT_MSV = 600

export interface RadiationResult {
  evaDurationSol: number
  doseMsv: number
  percentOfCareerLimit: number
}

/**
 * Estimate the radiation dose for an EVA of the given duration in hours.
 */
export function estimateRadiation(evaDurationHours: number): RadiationResult {
  const solHours = 24.6229
  const evaDurationSol = evaDurationHours / solHours
  const doseMsv = evaDurationSol * RAD_SURFACE_DOSE_RATE_MSV_PER_SOL
  const percentOfCareerLimit = (doseMsv / CAREER_DOSE_LIMIT_MSV) * 100
  return { evaDurationSol, doseMsv, percentOfCareerLimit }
}
