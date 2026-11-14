/** Display formatting helpers. All numeric UI output should flow through these. */

export function formatKm(km: number, decimals = 1): string {
  return `${km.toFixed(decimals)} km`
}

export function formatElevationM(meters: number): string {
  const sign = meters < 0 ? '−' : '+'
  const abs = Math.abs(meters).toLocaleString('en-US', { maximumFractionDigits: 0 })
  return `${sign}${abs} m`
}

/** Minutes → "4 h 02 min" / "38 min". */
export function formatDurationMinutes(minutes: number): string {
  const total = Math.round(minutes)
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h === 0) return `${m} min`
  return `${h} h ${String(m).padStart(2, '0')} min`
}

export function formatPercent(fraction: number, decimals = 0): string {
  return `${(fraction * 100).toFixed(decimals)}%`
}
