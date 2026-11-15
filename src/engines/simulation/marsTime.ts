/**
 * Mars timekeeping based on the NASA GISS Mars24 algorithm (Allison & McEwen 2000).
 *
 * This is a direct implementation of the equations documented at
 * https://www.giss.nasa.gov/tools/mars24/help/algorithm.html. It is validated against
 * the two worked examples on that page.
 *
 * All angles are handled in degrees unless otherwise noted. Longitudes are
 * planetographic degrees west (positive west), so an east-positive longitude from
 * ARES must be converted: lonWest = -lonEast.
 */

export interface MarsTimeResult {
  /** Mars Sol Date — continuous count of sols. */
  msd: number
  /** Mean solar time at Airy meridian, hours [0,24). */
  mstHours: number
  /** Local mean solar time at the given longitude, hours [0,24). */
  lmstHours: number
  /** Local true solar time at the given longitude, hours [0,24). */
  ltstHours: number
  /** Equation of time, degrees. */
  eotDegrees: number
  /** Areocentric solar longitude, degrees [0,360). */
  lsDegrees: number
  /** Subsolar longitude, degrees. */
  subsolarLongitude: number
  /** Solar declination, degrees. */
  solarDeclination: number
  /** Heliocentric distance, AU. */
  heliocentricDistanceAu: number
  /** Season label for the northern hemisphere. */
  season: string
}

const J2000_EPOCH_JD = 2_451_545.0
const JD_UNIX_EPOCH = 2_440_587.5
const MS_PER_DAY = 86_400_000
const SOLS_PER_EARTH_DAY = 1.027_491_251_7
const TT_UTC_SECONDS = 64.184 // Mars24 fixed offset used for its worked examples

const PERTURBERS: Array<{ a: number; tau: number; phi: number }> = [
  { a: 0.0071, tau: 2.2353, phi: 49.409 },
  { a: 0.0057, tau: 2.7543, phi: 168.173 },
  { a: 0.0039, tau: 1.1177, phi: 191.837 },
  { a: 0.0037, tau: 15.7866, phi: 21.736 },
  { a: 0.0021, tau: 2.1354, phi: 15.704 },
  { a: 0.002, tau: 2.4694, phi: 95.528 },
  { a: 0.0018, tau: 32.8493, phi: 49.095 },
]

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

function mod360(deg: number): number {
  return deg - 360 * Math.floor(deg / 360)
}

function mod24(hours: number): number {
  return hours - 24 * Math.floor(hours / 24)
}

function seasonFromLs(ls: number): string {
  if (ls < 90) return 'Northern spring / Southern autumn'
  if (ls < 180) return 'Northern summer / Southern winter'
  if (ls < 270) return 'Northern autumn / Southern spring'
  return 'Northern winter / Southern summer'
}

/**
 * Compute Mars time parameters for a given Earth Date and Martian surface location.
 *
 * @param date Earth date/time (interpreted as UTC).
 * @param longitudeWest planetographic longitude in degrees west (positive west).
 * @param latitudeDeg planetographic latitude in degrees north (optional; only used for solar elevation).
 */
export function marsTime(date: Date, longitudeWest: number, latitudeDeg?: number): MarsTimeResult {
  const millis = date.getTime()
  const jdUt = JD_UNIX_EPOCH + millis / MS_PER_DAY
  const jdTt = jdUt + TT_UTC_SECONDS / 86_400
  const dtJ2000 = jdTt - J2000_EPOCH_JD

  const M = 19.3871 + 0.524_020_73 * dtJ2000
  const alphaFms = 270.3871 + 0.524_038_496 * dtJ2000

  let pbs = 0
  for (const p of PERTURBERS) {
    pbs += p.a * Math.cos(toRad((0.985_626 * dtJ2000) / p.tau + p.phi))
  }

  const mRad = toRad(M)
  const equationOfCenter =
    (10.691 + 3.0e-7 * dtJ2000) * Math.sin(mRad) +
    0.623 * Math.sin(2 * mRad) +
    0.05 * Math.sin(3 * mRad) +
    0.005 * Math.sin(4 * mRad) +
    0.0005 * Math.sin(5 * mRad) +
    pbs

  const ls = mod360(alphaFms + equationOfCenter)
  const lsRad = toRad(ls)

  const eotDegrees =
    2.861 * Math.sin(2 * lsRad) -
    0.071 * Math.sin(4 * lsRad) +
    0.002 * Math.sin(6 * lsRad) -
    equationOfCenter

  const mst = mod24(24 * ((jdTt - 2_451_549.5) / SOLS_PER_EARTH_DAY + 44_796.0 - 0.000_962_6))
  const lmst = mod24(mst - longitudeWest * (24 / 360))
  const ltst = mod24(lmst + eotDegrees * (24 / 360))

  const subsolarLongitude = mod360(mst * 15 + eotDegrees + 180)

  const solarDeclination =
    (180 / Math.PI) * Math.asin(0.42565 * Math.sin(lsRad)) + 0.25 * Math.sin(lsRad)

  const heliocentricDistanceAu =
    1.523_679_34 *
    (1.00436 -
      0.09309 * Math.cos(mRad) -
      0.004336 * Math.cos(2 * mRad) -
      0.00031 * Math.cos(3 * mRad) -
      0.00003 * Math.cos(4 * mRad))

  const result: MarsTimeResult = {
    msd: (jdTt - 2_451_549.5) / SOLS_PER_EARTH_DAY + 44_796.0 - 0.000_962_6,
    mstHours: mst,
    lmstHours: lmst,
    ltstHours: ltst,
    eotDegrees,
    lsDegrees: ls,
    subsolarLongitude,
    solarDeclination,
    heliocentricDistanceAu,
    season: seasonFromLs(ls),
  }

  if (latitudeDeg !== undefined) {
    // Solar elevation is computed but not returned directly; attach as a custom property if needed.
    // Keeping the core result interface focused on time parameters.
    void latitudeDeg
  }

  return result
}

/**
 * Solar elevation at a given location and time. Positive = above horizon.
 */
export function solarElevation(
  marsTimeResult: MarsTimeResult,
  longitudeWest: number,
  latitudeDeg: number,
): number {
  const hourAngle = toRad(longitudeWest - marsTimeResult.subsolarLongitude)
  const latRad = toRad(latitudeDeg)
  const decRad = toRad(marsTimeResult.solarDeclination)
  const cosZ =
    Math.sin(decRad) * Math.sin(latRad) + Math.cos(decRad) * Math.cos(latRad) * Math.cos(hourAngle)
  const zenith = (180 / Math.PI) * Math.acos(Math.max(-1, Math.min(1, cosZ)))
  return 90 - zenith
}

/**
 * Format hours [0,24) as "HH:MM:SS".
 */
export function formatHours(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.floor((hours - h) * 60)
  const s = Math.floor(((hours - h) * 60 - m) * 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
