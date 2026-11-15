/**
 * Marswalk oxygen-budget model (Module G).
 *
 * Built on the same Pandolf metabolic-energy model used for route planning
 * (`src/engines/pathfinding/costModel.ts`). Energy is converted to O₂ volume using the
 * published value 20.1 kJ per litre of O₂, and then to mass using a documented density.
 *
 * All outputs are planning estimates, not certified life-support calculations.
 */

import { metabolicPowerWatts, type CostModelParams } from '@/engines/pathfinding/costModel'
import type { MissionConfig } from './missionConfig'

/** Energy per litre of O₂ at standard conditions — published constant used in the original Pandolf work. */
export const KJ_PER_LITER_O2 = 20.1

/**
 * Density of O₂ gas at standard temperature and pressure (0 °C, 1 atm), kg/L.
 * This converts the Pandolf-derived O₂ volume into mass for comparison with the tank mass.
 * Real tanks store liquid or high-pressure gas; this is a planning approximation.
 */
export const O2_GAS_DENSITY_KG_PER_L = 1.429 / 1000

export interface OxygenResult {
  /** Total metabolic energy for the walk, joules. */
  totalEnergyJ: number
  /** Locomotion duration in hours. */
  locomotionHours: number
  /** Total mission duration including stops, hours. */
  totalDurationHours: number
  /** O₂ volume required for the walk, litres. */
  oxygenLiters: number
  /** O₂ mass required for the walk, kg. */
  oxygenMassKg: number
  /** O₂ mass in the tank, kg. */
  tankMassKg: number
  /** O₂ mass that must remain as reserve, kg. */
  reserveMassKg: number
  /** O₂ mass available for the walk before hitting reserve, kg. */
  availableMassKg: number
  /** O₂ mass remaining after the walk, kg. */
  remainingMassKg: number
  /** Margin as a fraction of available O₂ (negative means deficit). */
  marginFraction: number
}

function costParamsFromConfig(config: MissionConfig): CostModelParams {
  return {
    bodyMassKg: config.bodyMassKg,
    loadMassKg: config.loadMassKg,
    speedMps: config.speedMps,
    suitPenalty: config.suitPenalty,
    gravityFactor: 3.71 / 9.81,
    terrainFactor: config.terrainFactor,
  }
}

/**
 * Estimate the oxygen budget for a mission.
 *
 * The route is approximated by its total distance, gain and loss, and maximum slope. Energy is
 * computed by integrating Pandolf power over locomotion time, using the average grade. The
 * result is a planning estimate; a real EVA would use per-step metabolic measurements.
 */
export function estimateOxygen(config: MissionConfig): OxygenResult {
  const params = costParamsFromConfig(config)
  const distanceM = config.routeDistanceMeters

  // When the route was imported from the planner, use its DEM-derived average slope. Otherwise
  // fall back to the net grade from gain/loss — a deliberate simplification documented in UI.
  const averageGradePercent =
    config.averageSlopeDegrees > 0
      ? Math.tan((config.averageSlopeDegrees * Math.PI) / 180) * 100
      : distanceM > 0
        ? ((config.elevationGainMeters - config.elevationLossMeters) / distanceM) * 100
        : 0

  const locomotionHours = distanceM / config.speedMps / 3600
  const totalEnergyJ = metabolicPowerWatts(averageGradePercent, params) * locomotionHours * 3600

  const totalDurationHours = locomotionHours + config.stopDurationMinutes / 60

  const oxygenLiters = totalEnergyJ / 1000 / KJ_PER_LITER_O2
  const oxygenMassKg = oxygenLiters * O2_GAS_DENSITY_KG_PER_L

  const tankMassKg = config.oxygenTankMassKg
  const reserveMassKg = tankMassKg * config.reserveFraction
  const availableMassKg = tankMassKg - reserveMassKg
  const remainingMassKg = availableMassKg - oxygenMassKg
  const marginFraction = availableMassKg > 0 ? remainingMassKg / availableMassKg : 0

  return {
    totalEnergyJ,
    locomotionHours,
    totalDurationHours,
    oxygenLiters,
    oxygenMassKg,
    tankMassKg,
    reserveMassKg,
    availableMassKg,
    remainingMassKg,
    marginFraction,
  }
}

/**
 * Point-of-no-return estimate.
 *
 * Returns the maximum fraction of the outbound route that can be travelled before the
 * remaining oxygen is insufficient for the walk back, assuming the return path costs the same
 * as the outbound path multiplied by a detour factor (default 1.2). A value of 1.0 means the
 * entire route can be completed and still allow a return within the reserve.
 */
export function pointOfNoReturn(
  config: MissionConfig,
  oxygen: OxygenResult,
  returnDetourFactor = 1.2,
): { fraction: number; distanceMeters: number; reason: string } {
  const used = oxygen.oxygenMassKg
  const available = oxygen.availableMassKg

  if (used <= 0 || config.routeDistanceMeters <= 0) {
    return { fraction: 0, distanceMeters: 0, reason: 'No route data.' }
  }

  // Outbound cost rate = used per meter. Return cost rate = used per meter * detour factor.
  // At fraction f outbound: used_so_far = f * used
  // Return distance = (1 - f) * distance; return cost = (1 - f) * used * detourFactor
  // Breach when f * used + (1 - f) * used * detourFactor = available
  // Solve: f = (available/used - detourFactor) / (1 - detourFactor)
  const ratio = available / used
  if (ratio >= 1) {
    return {
      fraction: 1,
      distanceMeters: config.routeDistanceMeters,
      reason: 'Sufficient oxygen to reach the destination within the reserve.',
    }
  }

  if (ratio <= returnDetourFactor) {
    return {
      fraction: 0,
      distanceMeters: 0,
      reason: 'Insufficient oxygen to leave the start and return within reserve.',
    }
  }

  const denominator = 1 - returnDetourFactor
  const fraction = (ratio - returnDetourFactor) / denominator
  return {
    fraction,
    distanceMeters: fraction * config.routeDistanceMeters,
    reason: 'Estimated last safe point before the return reserve is exhausted.',
  }
}
