/**
 * Mission verdict logic for the Marswalk simulator.
 *
 * READY / CAUTION / NO-GO are planning classifications based on the oxygen margin. They do
 * not certify that an EVA is safe; they flag where the estimate stands relative to the
 * configured reserve.
 */

import type { OxygenResult } from './oxygenModel'

export type MissionVerdict = 'ready' | 'caution' | 'no-go'

export interface VerdictResult {
  verdict: MissionVerdict
  label: string
  color: 'success' | 'amber' | 'danger'
  explanation: string
}

export function missionVerdict(oxygen: OxygenResult, reserveFraction: number): VerdictResult {
  const margin = oxygen.marginFraction
  const remaining = oxygen.remainingMassKg

  if (margin >= 0.2) {
    return {
      verdict: 'ready',
      label: 'READY',
      color: 'success',
      explanation: `O₂ margin is ${(margin * 100).toFixed(0)}% above the configured reserve. The plan fits within the estimated budget with a comfortable buffer.`,
    }
  }

  if (remaining >= -1e-9) {
    return {
      verdict: 'caution',
      label: 'CAUTION',
      color: 'amber',
      explanation: `O₂ margin is only ${(margin * 100).toFixed(0)}% above the configured reserve. The walk is estimated to fit, but the buffer is thin.`,
    }
  }

  return {
    verdict: 'no-go',
    label: 'NO-GO',
    color: 'danger',
    explanation: `Estimated O₂ use exceeds the amount available before the ${(reserveFraction * 100).toFixed(0)}% reserve. Reduce distance, load or slope, or increase the O₂ supply.`,
  }
}
