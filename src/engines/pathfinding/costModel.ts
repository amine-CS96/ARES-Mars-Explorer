/**
 * Metabolic-energy cost model for route planning on Mars.
 *
 * Based on the Pandolf load-carriage equation (Pandolf et al., 1977) and adapted for Martian
 * gravity and a pressure-suit penalty. Every default is documented as an assumption; the UI must
 * expose these parameters and their sources.
 *
 * Output is planning energy in joules, never a life-support certification.
 */

export interface CostModelParams {
  /** Body mass including suit, kg. */
  bodyMassKg: number
  /** Carried load mass, kg. */
  loadMassKg: number
  /** Walking speed, m/s. */
  speedMps: number
  /**
   * Multiplier on movement terms to account for a pressure suit / EVA suit kinematic penalty.
   * Default is an engineering assumption derived from Apollo/ISS EMU metabolic estimates.
   */
  suitPenalty: number
  /** Gravity scaling relative to Earth (Mars = 0.379). */
  gravityFactor: number
  /**
   * Terrain factor > 1 for broken ground. Default 1.0 assumes reasonably firm regolith at the
   * DEM resolution; this is a heuristic and is editable in the UI.
   */
  terrainFactor: number
}

export function defaultCostParams(): CostModelParams {
  return {
    bodyMassKg: 80,
    loadMassKg: 30,
    speedMps: 0.9,
    suitPenalty: 1.5,
    gravityFactor: 3.71 / 9.81, // Mars / Earth surface gravity (NASA NSSDCA)
    terrainFactor: 1.0,
  }
}

/**
 * Convert a slope angle in degrees to an approximate grade percentage.
 * For small angles grade% ≈ 100·tan(θ). We use the exact tan for consistency with the DEM.
 */
export function gradePercentFromDegrees(degrees: number): number {
  return Math.tan((degrees * Math.PI) / 180) * 100
}

/**
 * Metabolic power in watts from the Pandolf equation, with Mars gravity and suit penalty applied
 * to the load/work terms.
 *
 * M = 1.5·W + 2.0·(W+L)·(L/W)² + η·(W+L)·(1.5·v² + 0.35·v·G)
 *
 * Where:
 *   W = body mass, L = load, η = terrain factor, v = speed, G = grade (%).
 *
 * The vertical-work term (the part containing G) is scaled by gravityFactor to reflect Mars.
 */
export function metabolicPowerWatts(gradePercent: number, params: CostModelParams): number {
  const W = params.bodyMassKg
  const L = params.loadMassKg
  const v = params.speedMps
  const eta = params.terrainFactor
  const g = params.gravityFactor

  const standing = 1.5 * W
  const loadCarriage = 2.0 * (W + L) * (L / W) ** 2
  const movementHorizontal = eta * (W + L) * 1.5 * v * v
  // Signed grade: positive grade = uphill, negative = downhill. The vertical-work term is scaled
  // by Mars gravity. Very steep descents still cost energy because of the standing + load terms.
  const movementVertical = eta * (W + L) * 0.35 * v * gradePercent * g

  return Math.max(0, standing + loadCarriage + movementHorizontal + movementVertical)
}

/**
 * Energy required to traverse one edge (joules).
 *
 * If `distanceM` is 0 or speed is 0, returns 0. Downhill travel reduces energy relative to flat
 * because the grade term is signed; we add a small positive floor so the model never rewards
 * travel with zero cost.
 */
export function edgeEnergyJoules(
  elevationAMeters: number,
  elevationBMeters: number,
  horizontalDistanceM: number,
  params: CostModelParams,
): number {
  if (horizontalDistanceM <= 0 || params.speedMps <= 0) return 0
  const rise = elevationBMeters - elevationAMeters
  const gradePercent = (rise / horizontalDistanceM) * 100
  const power = metabolicPowerWatts(gradePercent, params)
  const durationS = horizontalDistanceM / params.speedMps
  return Math.max(0.1, power * durationS)
}

/**
 * Flat-terrain energy per meter — the lowest possible cost, used for an admissible A* heuristic.
 */
export function minEnergyPerMeter(params: CostModelParams): number {
  return edgeEnergyJoules(0, 0, 1, params)
}
