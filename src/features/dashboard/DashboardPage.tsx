import { HeroSection } from './sections/HeroSection'
import { ModuleGrid } from './sections/ModuleGrid'
import { PlanetaryStatsSection } from './sections/PlanetaryStatsSection'
import { FeaturedLocationsSection } from './sections/FeaturedLocationsSection'
import { ProgramStatusSection } from './sections/ProgramStatusSection'
import { DataStatusSection } from './sections/DataStatusSection'
import { Separator } from '@/components/ui/separator'

/**
 * Module A — Mission Dashboard. Sections:
 * 1. Mission Control (hero) · 2. Modules · 3. Telemetry · 4. Featured sites ·
 * 5. Program status · 6. Data spine
 */
export function DashboardPage() {
  return (
    <div className="space-y-14 sm:space-y-16">
      <HeroSection />
      <ModuleGrid />
      <PlanetaryStatsSection />
      <FeaturedLocationsSection />
      <ProgramStatusSection />
      <Separator className="mx-4 sm:mx-6" />
      <DataStatusSection />
    </div>
  )
}
