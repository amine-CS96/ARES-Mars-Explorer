/**
 * Ares program phases — mirrors docs/DEVELOPMENT_ROADMAP.md. This is the honest status shown
 * on the dashboard; update it together with PROJECT_STATUS.md.
 */

export type PhaseStatus = 'done' | 'active' | 'planned'

export interface ProgramPhase {
  id: number
  name: string
  focus: string
  status: PhaseStatus
}

export const programPhases: ProgramPhase[] = [
  { id: 0, name: 'Phase 0 · Foundation docs', focus: 'References, verified data, documentation system', status: 'done' },
  { id: 1, name: 'Phase 1 · App foundation', focus: 'Design system, navigation, dashboard, atlas, data registry', status: 'active' },
  { id: 2, name: 'Phase 2 · 3D Mars globe', focus: 'Three.js globe, atmosphere, markers, quality tiers', status: 'planned' },
  { id: 3, name: 'Phase 3 · Jezero explorer', focus: 'Regional tiles, DEM pipeline, layer manager', status: 'planned' },
  { id: 4, name: 'Phase 4 · Terrain & routing', focus: 'Hazard analysis, A* route planner, profiles', status: 'planned' },
  { id: 5, name: 'Phase 5 · Marswalk simulator', focus: 'Oxygen budget, verdicts, mission clock', status: 'planned' },
  { id: 6, name: 'Phase 6 · Polish & demo', focus: 'Performance, accessibility, E2E, deployment', status: 'planned' },
]
