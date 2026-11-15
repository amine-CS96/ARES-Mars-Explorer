/**
 * Mission configuration for the Marswalk simulator (Module G).
 *
 * Every parameter is editable in the UI and displayed with its source or as an explicit
 * engineering assumption. No value is hidden or hard-coded in the engine.
 */

import { z } from 'zod'

export const missionConfigSchema = z.object({
  /** Route distance in meters. */
  routeDistanceMeters: z.number().min(1).max(100_000),
  /** Total elevation gain along the route in meters. */
  elevationGainMeters: z.number().min(0).max(20_000),
  /** Total elevation loss along the route in meters (positive value). */
  elevationLossMeters: z.number().min(0).max(20_000),
  /** Maximum slope encountered, degrees. */
  maxSlopeDegrees: z.number().min(0).max(90),
  /** Average slope encountered, degrees (derived from the DEM cost grid). */
  averageSlopeDegrees: z.number().min(0).max(90),
  /** Total metabolic energy computed by the route planner, kJ (optional reference). */
  plannerTotalEnergyKJ: z.number().min(0).optional(),
  /** Body mass including the pressure suit, kg. */
  bodyMassKg: z.number().min(30).max(200),
  /** Carried equipment/load mass, kg. */
  loadMassKg: z.number().min(0).max(200),
  /** Expected walking speed, m/s. */
  speedMps: z.number().min(0.1).max(3),
  /** Multiplier on movement terms for suit kinematic penalty. */
  suitPenalty: z.number().min(1).max(5),
  /** Terrain factor > 1 for broken ground. */
  terrainFactor: z.number().min(1).max(5),
  /** Total O₂ tank mass, kg (mass of O₂ content, regardless of storage phase). */
  oxygenTankMassKg: z.number().min(0.1).max(50),
  /** Reserve fraction that must remain at the end of the walk (0–1). */
  reserveFraction: z.number().min(0).max(0.95),
  /** Optional stop durations in minutes (e.g. science stops). Cost-neutral to locomotion. */
  stopDurationMinutes: z.number().min(0).max(600),
})

export type MissionConfig = z.infer<typeof missionConfigSchema>

export function defaultMissionConfig(): MissionConfig {
  return {
    routeDistanceMeters: 5000,
    elevationGainMeters: 50,
    elevationLossMeters: 50,
    maxSlopeDegrees: 10,
    averageSlopeDegrees: 0,
    bodyMassKg: 80,
    loadMassKg: 30,
    speedMps: 0.9,
    suitPenalty: 1.5,
    terrainFactor: 1.0,
    oxygenTankMassKg: 1.0,
    reserveFraction: 0.25,
    stopDurationMinutes: 30,
  }
}

/**
 * Persistable route summary produced by the route planner and consumed by the simulator.
 */
export const routeSummarySchema = z.object({
  distanceMeters: z.number(),
  elevationGainMeters: z.number(),
  elevationLossMeters: z.number(),
  maxSlopeDegrees: z.number(),
  averageSlopeDegrees: z.number(),
  /** Optional reference: the simulator recomputes energy from its own model. */
  totalEnergyKJ: z.number().optional(),
})

export type RouteSummary = z.infer<typeof routeSummarySchema>

export const SIMULATOR_ROUTE_KEY = 'ares:simulator-route-summary'
