import { Globe2 } from 'lucide-react'
import { ModuleStatusPage } from '@/components/layout/ModuleStatusPage'

/** Module B — placeholder until Phase 2 ships the Three.js globe. */
export function GlobePage() {
  return (
    <ModuleStatusPage
      eyebrow="Module B · Interactive globe"
      title="3D Mars Globe"
      moduleCode="GLOBE"
      phase={2}
      description="A real-texture Three.js Mars globe: rotate, zoom and inspect markers for the exploration atlas — with atmosphere, realistic lighting and a graceful fallback when WebGL is unavailable."
      plannedFeatures={[
        { icon: Globe2, text: 'Planet textured with the verified MOLA color-hillshade and Viking color mosaics (Mars Trek WMTS)' },
        { icon: Globe2, text: 'Atmosphere rim shader and day/night lighting' },
        { icon: Globe2, text: 'Rotation, zoom, touch controls and smooth camera transitions' },
        { icon: Globe2, text: 'Latitude/longitude grid and clickable POI markers from the Atlas' },
        { icon: Globe2, text: 'Adaptive quality tiers (high / medium / low) with resource disposal' },
        { icon: Globe2, text: 'Graceful fallback if WebGL fails or textures cannot load' },
      ]}
      dataBasis="Verified Mars Trek WMTS layers — MGS MOLA color hillshade (463 m/px), Viking MDIM 2.1 color (232 m/px), optional HRSC blend (200 m/px) and THEMIS night IR (100 m/px). Tile URLs were verified live from this environment."
    />
  )
}
