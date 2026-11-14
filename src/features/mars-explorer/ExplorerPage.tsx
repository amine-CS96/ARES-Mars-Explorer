import { Mountain } from 'lucide-react'
import { ModuleStatusPage } from '@/components/layout/ModuleStatusPage'

/** Module C — placeholder until Phase 3 ships the Jezero surface explorer. */
export function ExplorerPage() {
  return (
    <ModuleStatusPage
      eyebrow="Module C · Surface exploration"
      title="Jezero Crater Explorer"
      moduleCode="EXPLORER"
      phase={3}
      description="Detailed 2D/3D exploration of Jezero Crater — Perseverance's home — with toggleable scientific layers, coordinate and elevation inspection, and full attribution for every layer."
      plannedFeatures={[
        { icon: Mountain, text: 'Regional imagery layers (HiRISE 25 cm, CTX 6 m) once per-layer tile matrices are derived from GetCapabilities' },
        { icon: Mountain, text: 'Elevation layer from real PDS DEMs processed by our Node pipeline (geotiff.js + sharp)' },
        { icon: Mountain, text: 'Layer manager: imagery, elevation, hillshade, slope, science POIs' },
        { icon: Mountain, text: 'Perseverance rover track from the verified MMGIS waypoint feed (dated snapshot)' },
        { icon: Mountain, text: 'Point inspection panels: coordinates, elevation, slope, local context' },
        { icon: Mountain, text: 'Reusable region config so Gale, Olympus Mons and others slot in later' },
      ]}
      dataBasis="Jezero mosaic layer IDs confirmed in the official Trek catalog; raw elevation comes from PDS DTMs discovered via the Mars Orbital Data Explorer. Regional tile endpoints remain pending-verification (KNOWN_ISSUES K-3) and will not ship before they are confirmed."
    />
  )
}
