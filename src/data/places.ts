import { poiSchema, type PointOfInterest } from '@/types/poi'

/**
 * Curated points of interest. Validated with the poi zod schema at module load — a bad edit
 * fails loudly instead of shipping wrong science.
 *
 * Accuracy policy (docs/SCIENTIFIC_MODELS.md §8):
 *  - verified: coordinates published by NASA/JPL/MMGIS or the USGS Gazetteer
 *  - approximate: well-known feature centers quoted with an explicit note
 *  - illustrative: fiction (e.g. The Martian's Ares 3 site)
 *
 * All longitude values are east-positive in [-180, 180]; conversions from 0–360°E sources are
 * commented per-entry (docs/DECISIONS.md D-010).
 */

const NASA_MARS2020 = {
  label: 'NASA/JPL — Mars 2020 (Perseverance) mission',
  url: 'https://mars.nasa.gov/mars2020/',
} as const

const NASA_MMGIS_WAYPOINTS = {
  label: 'NASA/JPL MMGIS — Perseverance waypoint feed (M20_waypoints.json)',
  url: 'https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_waypoints.json',
} as const

const USGS_GAZETTEER = {
  label: 'USGS Astrogeology — Gazetteer of Planetary Nomenclature',
  url: 'https://planetarynames.wr.usgs.gov/',
} as const

const NASA_MSL = {
  label: 'NASA/JPL — Mars Science Laboratory (Curiosity) mission',
  url: 'https://mars.nasa.gov/msl/',
} as const

const rawPlaces: PointOfInterest[] = [
  {
    id: 'octavia-e-butler-landing',
    name: 'Octavia E. Butler Landing',
    category: 'landing-site',
    // NASA/JPL published touchdown coordinates for Perseverance (18 Feb 2021).
    coordinates: { lat: 18.4447, lon: 77.4508 },
    accuracy: 'verified',
    summary:
      'Perseverance rover touchdown site on the western floor of Jezero Crater, 18 February 2021. ' +
      'Named after the science-fiction author. The rover has since traversed from here to the ' +
      'delta and the crater rim, leaving a waypoint trail in the MMGIS feed.',
    geology:
      'Crater-floor volcanic unit adjacent to the western river delta; breakup of the landing ' +
      'ellipse terrain was one of the reasons Mars 2020 targeted this area.',
    missions: ['Mars 2020 / Perseverance'],
    hazards: [],
    region: 'jezero-crater',
    sources: [NASA_MARS2020, NASA_MMGIS_WAYPOINTS],
    featured: true,
  },
  {
    id: 'three-forks-sample-depot',
    name: 'Three Forks Sample Depot',
    category: 'mission',
    // Mean of rover positions at the tube drops, from the NASA PDS Three Forks Depot archive
    // (as cross-checked by the Sol Atlas reference project); consistent with MMGIS waypoints.
    coordinates: { lat: 18.4528, lon: 77.4082 },
    accuracy: 'verified',
    elevationM: -2545,
    elevationNote:
      'Rover elevation at the tube drops ≈ −2,545 m (MOLA datum), per the NASA PDS depot archive.',
    summary:
      'The first sample depot on another world: ten sealed sample tubes deposited at the foot of ' +
      'the western delta between sols 653–690 (Dec 2022 – Jan 2023) as a backup for the ' +
      'Mars Sample Return campaign.',
    geology:
      'Sedimentary rocks at the delta front margin; the tubes sample igneous crater-floor and ' +
      'sedimentary delta units collected earlier in the traverse.',
    missions: ['Mars 2020 / Perseverance'],
    hazards: ['Delta-front scarps and talus nearby; keep routes off the scarp edge'],
    region: 'jezero-crater',
    sources: [NASA_MARS2020, NASA_MMGIS_WAYPOINTS],
    featured: true,
  },
  {
    id: 'seitah',
    name: 'Séítah',
    category: 'geology',
    // Rover parking position on the Séítah unit edge (sols 248–278), from MMGIS waypoints.
    coordinates: { lat: 18.4339, lon: 77.4430 },
    accuracy: 'verified',
    summary:
      'Crater-floor unit of coarse, olivine-rich igneous bedrock that Perseverance explored from ' +
      'its edge (sols 248–278) and cored (e.g. Coulettes, sol 271). The rubbly surface made the ' +
      'rover divert around it — the same hazard an astronaut would need to route around.',
    geology:
      'Interpreted as altered igneous (olivine-rich) cumulate, among the oldest rocks sampled on ' +
      'the crater floor; carbonates reported in associated alteration.',
    missions: ['Mars 2020 / Perseverance'],
    hazards: ['Rubble-strewn bedrock; walking speed and safety margin reduced'],
    region: 'jezero-crater',
    sources: [NASA_MARS2020, NASA_MMGIS_WAYPOINTS],
    featured: false,
  },
  {
    id: 'jezero-delta-front',
    name: 'Jezero Delta Front',
    category: 'geology',
    // Rover parking position on the delta front (sols 477–502), from MMGIS waypoints.
    coordinates: { lat: 18.4589, lon: 77.4061 },
    accuracy: 'verified',
    summary:
      'The edge of the ancient western river delta inside Jezero Crater, where fine-grained ' +
      'sediments deposited by water were sampled (e.g. Skyland core, sol 495). A prime target ' +
      'in the search for ancient habitable environments.',
    geology:
      'Deltaic sedimentary rocks — mudstone/sandstone layers from a former lake-delta system; ' +
      'steep scarps mark the delta front.',
    missions: ['Mars 2020 / Perseverance'],
    hazards: ['Steep scarp slopes at the delta edge; avoid the scarp line on foot'],
    region: 'jezero-crater',
    sources: [NASA_MARS2020, NASA_MMGIS_WAYPOINTS],
    featured: false,
  },
  {
    id: 'jezero-crater',
    name: 'Jezero Crater',
    category: 'region',
    // Commonly published crater-center values (USGS Gazetteer lists the crater; values quoted
    // in mission literature vary slightly in the second decimal).
    coordinates: { lat: 18.38, lon: 77.58 },
    accuracy: 'approximate',
    coordinateNote: 'Crater center; published values vary slightly (≈ 18.38°N, 77.58°E).',
    summary:
      'A ~45 km impact crater on the western rim of the Isidis basin, chosen as the Mars 2020 ' +
      'landing site because it preserves an ancient river delta and lake sediments from a period ' +
      'when water filled the crater. This is ARES’ first explorable region (Phase 3).',
    geology:
      'Crater floor volcanics overlain by fluvio-deltaic sediments; outlet/inlet channels ' +
      '(Neretva Vallis) carve the western rim.',
    missions: ['Mars 2020 / Perseverance'],
    hazards: [],
    region: 'global',
    sources: [USGS_GAZETTEER, NASA_MARS2020],
    featured: true,
  },
  {
    id: 'olympus-mons',
    name: 'Olympus Mons',
    category: 'geology',
    // Gazetteer feature coordinates: 18.65°N, 226.2°E (0–360°E) ≡ 133.8°W (D-010).
    coordinates: { lat: 18.65, lon: -133.8 },
    accuracy: 'verified',
    coordinateNote: '226.2°E in the 0–360°E convention ≡ 133.8°W.',
    summary:
      'The largest known volcano in the solar system, rising roughly 22 km above the surrounding ' +
      'plains with a summit caldera complex tens of kilometers across — a shield volcano built ' +
      'over hundreds of millions of years.',
    geology:
      'Basaltic shield volcano with terraced flanks and multiple summit calderas; young lava ' +
      'flows relative to its base.',
    missions: [],
    hazards: ['Elevation changes far beyond walkable scales; summit winds and cold (est.)'],
    region: 'global',
    sources: [USGS_GAZETTEER],
    featured: true,
  },
  {
    id: 'valles-marineris',
    name: 'Valles Marineris',
    category: 'geology',
    // System center commonly quoted around 14°S, 301.5°E (0–360°E) ≡ 58.5°W.
    coordinates: { lat: -14, lon: -58.5 },
    accuracy: 'approximate',
    coordinateNote: 'System center ≈ 14°S, 301.5°E (0–360°E) ≡ 58.5°W; the system spans ~20° of longitude.',
    summary:
      'The great canyon system of Mars: thousands of kilometers long and up to ~7 km deep in ' +
      'places, dwarfing any terrestrial canyon. Layered deposits inside the canyons remain an ' +
      'active scientific target.',
    geology:
      'Extensional tectonic troughs along the Tharsis bulge flank, with interior layered ' +
      'deposits and landslides.',
    missions: [],
    hazards: ['Cliff walls up to kilometers high; unstable talus; no walkable path across'],
    region: 'global',
    sources: [USGS_GAZETTEER],
    featured: false,
  },
  {
    id: 'gale-crater',
    name: 'Gale Crater',
    category: 'region',
    // Commonly published crater-center values.
    coordinates: { lat: -5.4, lon: 137.8 },
    accuracy: 'approximate',
    coordinateNote: 'Crater center ≈ 5.4°S, 137.8°E.',
    summary:
      'Home of Curiosity (MSL) since 2012: a crater with a 5 km-high sedimentary mound (Aeolis ' +
      'Mons / Mount Sharp) recording billions of years of environmental change, including ' +
      'long-lived ancient lakes.',
    geology:
      'Layered sedimentary fill — clays, sulfates, and hematite units mapped from orbit and ' +
      'ground-truthed by the rover.',
    missions: ['Mars Science Laboratory / Curiosity'],
    hazards: [],
    region: 'global',
    sources: [USGS_GAZETTEER, NASA_MSL],
    featured: false,
  },
  {
    id: 'bradbury-landing',
    name: 'Bradbury Landing',
    category: 'landing-site',
    // NASA/JPL published Curiosity touchdown coordinates (6 Aug 2012 UTC).
    coordinates: { lat: -4.5895, lon: 137.4417 },
    accuracy: 'verified',
    coordinateNote: 'Informal name for the MSL touchdown point, honoring Ray Bradbury.',
    summary:
      'Curiosity rover touchdown site in Gale Crater, 6 August 2012 (UTC). The start of a ' +
      'decade-plus traverse that climbed Mount Sharp — a template for long-duration surface ' +
      'exploration.',
    geology:
      'Alluvial fan material at the northwestern edge of Aeolis Mons (Mount Sharp).',
    missions: ['Mars Science Laboratory / Curiosity'],
    hazards: [],
    region: 'global',
    sources: [NASA_MSL],
    featured: false,
  },
  {
    id: 'ares-3-site',
    name: 'Ares III Site (Acidalia Planitia)',
    category: 'fiction',
    // Fictional coordinates from the novel; the underlying terrain is real and was imaged by
    // MRO HiRISE (Trek layer ESP_040776_2115_RED_A_01_ORTHO, "Martian Ares 3 Landing Site").
    coordinates: { lat: 31.2, lon: -28.5 },
    accuracy: 'illustrative',
    coordinateNote: 'Fictional base from The Martian (31.2°N, 28.5°W). Shown for transparency — not a real mission.',
    summary:
      'Mark Watney’s base in Andy Weir’s The Martian, placed in Acidalia Planitia. ARES keeps it ' +
      'on the map as a clearly-flagged fiction entry — and as a wink to every route planner ' +
      'that has ever run the numbers to survive.',
    geology: 'Northern-lowlands plains terrain (real); site placement is fictional.',
    missions: ['Fiction — The Martian (Andy Weir, 2014)'],
    hazards: [],
    region: 'global',
    sources: [
      { label: 'Andy Weir — The Martian (novel, 2014)' },
      {
        label: 'Mars Trek catalog — MRO HiRISE “Ares 3 Landing Site” mosaic layer',
        url: 'https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars',
      },
    ],
    featured: false,
  },
]

/** Validated at module load; see types/poi.ts. */
export const places: PointOfInterest[] = rawPlaces.map((place) => poiSchema.parse(place))

export const featuredPlaces: PointOfInterest[] = places.filter((p) => p.featured)

export function getPlaceById(id: string): PointOfInterest | undefined {
  return places.find((p) => p.id === id)
}
