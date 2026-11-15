import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  Database,
  Globe2,
  Map as MapIcon,
  Mountain,
  Rocket,
  Route,
  ShieldAlert,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SectionHeading } from '@/components/ui/section-heading'

interface DashboardModule {
  to: string
  title: string
  description: string
  icon: LucideIcon
  /** Shown as-is next to the module title. */
  status: string
  statusVariant: 'success' | 'default' | 'outline' | 'warning'
}

/** Public-facing mission systems overview. */
export function ModuleGrid() {
  const modules: DashboardModule[] = [
    {
      to: '/atlas',
      title: 'Exploration Atlas',
      description: 'Searchable, source-cited points of interest with accuracy labels.',
      icon: MapIcon,
      status: 'Open',
      statusVariant: 'outline',
    },
    {
      to: '/data-sources',
      title: 'Data & Sources',
      description: 'Every dataset: provider, instrument, resolution, kind, credits.',
      icon: Database,
      status: 'Open',
      statusVariant: 'outline',
    },
    {
      to: '/globe',
      title: 'Mars Globe',
      description: 'Real-texture 3D planet with markers, atmosphere and lighting.',
      icon: Globe2,
      status: 'Open',
      statusVariant: 'outline',
    },
    {
      to: '/explorer',
      title: 'Jezero Explorer',
      description: 'Regional 2D/3D surface exploration with scientific layers.',
      icon: Mountain,
      status: 'Open',
      statusVariant: 'outline',
    },
    {
      to: '/hazards',
      title: 'Hazard Analysis',
      description: 'Slope-derived difficulty classes with documented criteria.',
      icon: ShieldAlert,
      status: 'Open',
      statusVariant: 'outline',
    },
    {
      to: '/planner',
      title: 'Route Planner',
      description: 'A* over terrain cost — distance, slope, difficulty, safety prefs.',
      icon: Route,
      status: 'Open',
      statusVariant: 'outline',
    },
    {
      to: '/simulator',
      title: 'Marswalk Simulator',
      description: 'Oxygen budget, return feasibility, READY / CAUTION / NO-GO.',
      icon: Rocket,
      status: 'Open',
      statusVariant: 'outline',
    },
    {
      to: '/atlas',
      title: 'Mission Dashboard',
      description: 'You are here — overview, telemetry, and featured sites.',
      icon: Sparkles,
      status: 'Open',
      statusVariant: 'outline',
    },
  ]

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6">
      <SectionHeading
        eyebrow="Mission systems"
        title="Explore, plan and simulate"
        description="Every tool is built on verified NASA/USGS data and is open for exploration."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {modules.map((mod, i) => {
          const { icon: Icon } = mod
          return (
            <Card
              key={`${mod.to}-${mod.title}`}
              className="group transition-colors hover:border-line-strong hover:bg-white/[0.045]"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <span className="flex size-9 items-center justify-center rounded-lg border border-line bg-white/[0.03]">
                    <Icon className="size-4 text-cyan" />
                  </span>
                  <Badge variant={mod.statusVariant}>{mod.status}</Badge>
                </div>
                <CardTitle className="mt-2">
                  <Link
                    to={mod.to}
                    className="inline-flex items-center gap-1.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70"
                  >
                    {mod.title}
                    <ArrowUpRight className="size-3.5 text-ink-faint transition-colors group-hover:text-cyan" />
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-ink-dim">{mod.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
