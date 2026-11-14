import { Rocket } from 'lucide-react'
import { ModuleStatusPage } from '@/components/layout/ModuleStatusPage'

/** Module G — placeholder until Phase 5 ships the Marswalk simulator. */
export function SimulatorPage() {
  return (
    <ModuleStatusPage
      eyebrow="Module G · Marswalk mission simulator"
      title="Marswalk Simulator"
      moduleCode="SIM"
      phase={5}
      description="Configure the astronaut, the suit, the oxygen and the plan — ARES computes consumption, return feasibility and a mission verdict, with every assumption editable and displayed."
      plannedFeatures={[
        { icon: Rocket, text: 'Inputs: astronaut/equipment mass, O₂ supply + reserve, speed, stop durations, max slope' },
        { icon: Rocket, text: 'Oxygen model: Pandolf load-carriage equation adapted to Mars gravity + suit penalty' },
        { icon: Rocket, text: 'Mission clock: Mars24 (Allison & McEwen 2000) local solar time at the site' },
        { icon: Rocket, text: 'Point-of-no-return marker: the last spot with a survivable walk back' },
        { icon: Rocket, text: 'Verdict: READY / CAUTION / NO-GO with margin and explanation' },
        { icon: Rocket, text: 'Context panels: RAD surface dose (Hassler et al. 2014), always with citations' },
      ]}
      dataBasis="Every constant comes from a published source or is an explicitly labeled engineering assumption (docs/SCIENTIFIC_MODELS.md §4). The simulator is a planning estimate — never a certified life-support calculation."
    />
  )
}
