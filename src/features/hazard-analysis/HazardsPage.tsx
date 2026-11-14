import { ShieldAlert } from 'lucide-react'
import { ModuleStatusPage } from '@/components/layout/ModuleStatusPage'

/** Module E — placeholder until Phase 4 ships hazard analysis on real DEM data. */
export function HazardsPage() {
  return (
    <ModuleStatusPage
      eyebrow="Module E · Terrain hazard analysis"
      title="Hazard Analysis"
      moduleCode="HAZARD"
      phase={4}
      description="Terrain difficulty from real elevation data: slope classes and roughness overrides, rendered as a hazard overlay — with explicit criteria and honest uncertainty statements."
      plannedFeatures={[
        { icon: ShieldAlert, text: 'Slope grids derived from the DEM (central differences, meters-per-pixel known)' },
        { icon: ShieldAlert, text: 'Difficulty classes: low < 5°, moderate 5–15°, high 15–25°, dangerous > 25° (published in-app, calibrated)' },
        { icon: ShieldAlert, text: 'MOLA surface-roughness layer as an additional override factor' },
        { icon: ShieldAlert, text: 'Point inspector: click anywhere for elevation, slope and class with data limits' },
        { icon: ShieldAlert, text: 'Uncertainty communication: at 463 m/px, sub-50 m rocks cannot be resolved — stated on-screen' },
      ]}
      dataBasis="Derived from processed Jezero DTMs (planned, PDS/ODE) and the verified MOLA roughness tiles. No hazard map is displayed until it is computed from real elevation with its criteria documented."
    />
  )
}
