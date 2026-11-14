import { Route } from 'lucide-react'
import { ModuleStatusPage } from '@/components/layout/ModuleStatusPage'

/** Module F — placeholder until Phase 4 ships A* routing on real terrain. */
export function PlannerPage() {
  return (
    <ModuleStatusPage
      eyebrow="Module F · Intelligent route planner"
      title="Marswalk Route Planner"
      moduleCode="PLANNER"
      phase={4}
      description="Pick a start, a destination and science stops — ARES finds the path that minimizes metabolic energy (≈ oxygen) over real terrain, avoiding slopes beyond your limits, and explains the trade-offs."
      plannedFeatures={[
        { icon: Route, text: 'A* pathfinding over the terrain-cost grid (8-connected, corner-safe)' },
        { icon: Route, text: 'Cost function = metabolic energy (Pandolf-derived), not arbitrary weights' },
        { icon: Route, text: 'Recommended + alternative route, plus the straight-line comparison' },
        { icon: Route, text: 'Distance, duration estimate, elevation profile, max slope, hazard count' },
        { icon: Route, text: 'Plain-language explanation of why the route chose what it chose' },
        { icon: Route, text: 'Honest labeling: routes on synthetic demo terrain would be marked SIMULATED' },
      ]}
      dataBasis="Runs on the processed Jezero DEM (planned) with the cost model documented in docs/ROUTE_PLANNING.md. Routing stays disabled — or clearly SIMULATED — until a real DEM is in the pipeline."
    />
  )
}
