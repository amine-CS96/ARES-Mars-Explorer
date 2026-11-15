import { HeroSection } from './sections/HeroSection'
import { ModuleGrid } from './sections/ModuleGrid'
import { PlanetaryStatsSection } from './sections/PlanetaryStatsSection'
import { FeaturedLocationsSection } from './sections/FeaturedLocationsSection'
import { MissionWorkflowSection } from './sections/MissionWorkflowSection'
import { DataStatusSection } from './sections/DataStatusSection'
import { Separator } from '@/components/ui/separator'

/**
 * Mission Control dashboard. Sections:
 * 1. Hero · 2. Mission systems · 3. Planetary telemetry · 4. Featured sites ·
 * 5. Mission workflow · 6. Data spine
 */
export function DashboardPage() {
  return (
    <div className="space-y-14 sm:space-y-16">
      <HeroSection />
      <ModuleGrid />
      <PlanetaryStatsSection />
      <FeaturedLocationsSection />
      <MissionWorkflowSection />
      <Separator className="mx-4 sm:mx-6" />
      <DataStatusSection />
    </div>
  )
}
