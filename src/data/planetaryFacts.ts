/**
 * Planetary reference values for Mars — NASA NSSDCA Mars Fact Sheet.
 * Source (verified live 2026-11-14): https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html
 * Values are rounded to the precision shown on the fact sheet; display only.
 */

export interface PlanetaryFact {
  label: string
  value: string
  note?: string
}

export const MARS_FACTS_SOURCE = {
  label: 'NASA NSSDCA Mars Fact Sheet',
  url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html',
} as const

export const marsFacts: PlanetaryFact[] = [
  { label: 'Mean radius', value: '3,389.5 km', note: '0.532 × Earth' },
  { label: 'Surface gravity', value: '3.71 m/s²', note: '≈ 0.38 g' },
  { label: 'Mean solar day (sol)', value: '24.66 h', note: '24 h 39 min 35 s' },
  { label: 'Sidereal rotation', value: '24.62 h' },
  { label: 'Axial tilt', value: '25.19°', note: 'Earth-like seasons' },
  { label: 'Mean distance from Sun', value: '227.92 Gm', note: '1.52 AU' },
  { label: 'Orbital period', value: '686.98 d' },
  { label: 'Surface pressure', value: '~6.4 mbar', note: 'variable, < 1% of Earth' },
  { label: 'Surface temperature', value: '−153 to 20 °C', note: 'mean ≈ −65 °C' },
  { label: 'Atmosphere', value: 'CO₂ 95.3%', note: 'N₂ 2.6%, Ar 1.9%' },
  { label: 'Escape velocity', value: '5.03 km/s' },
  { label: 'Moons', value: '2', note: 'Phobos, Deimos' },
]
