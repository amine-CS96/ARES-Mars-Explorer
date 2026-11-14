import {
  Database,
  Globe2,
  LayoutDashboard,
  Map as MapIcon,
  Mountain,
  Rocket,
  Route,
  ShieldAlert,
} from 'lucide-react'
import type { ComponentType } from 'react'

export interface NavItem {
  to: string
  label: string
  icon: ComponentType<{ className?: string }>
}

/** Primary module navigation. Module short-names double as the mission-control vocabulary. */
export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Mission Control', icon: LayoutDashboard },
  { to: '/globe', label: 'Globe', icon: Globe2 },
  { to: '/explorer', label: 'Explorer', icon: Mountain },
  { to: '/atlas', label: 'Atlas', icon: MapIcon },
  { to: '/hazards', label: 'Hazards', icon: ShieldAlert },
  { to: '/planner', label: 'Planner', icon: Route },
  { to: '/simulator', label: 'Simulator', icon: Rocket },
  { to: '/data-sources', label: 'Data', icon: Database },
]
