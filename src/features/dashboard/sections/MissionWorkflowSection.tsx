import { Link } from 'react-router-dom'
import { Globe2, Mountain, ShieldAlert, Route, Rocket, ArrowRight } from 'lucide-react'
import { SectionHeading } from '@/components/ui/section-heading'
import type { LucideIcon } from 'lucide-react'

interface WorkflowStep {
  to: string
  label: string
  title: string
  description: string
  icon: LucideIcon
}

const STEPS: WorkflowStep[] = [
  {
    to: '/globe',
    label: 'Step 1',
    title: 'Global context',
    description: 'Start at the 3D Mars globe, then focus on Jezero Crater.',
    icon: Globe2,
  },
  {
    to: '/explorer',
    label: 'Step 2',
    title: 'Inspect terrain',
    description: 'Switch HiRISE/CTX layers and explore real 2D and 3D Jezero terrain.',
    icon: Mountain,
  },
  {
    to: '/hazards',
    label: 'Step 3',
    title: 'Assess hazards',
    description: 'See where slopes become difficult and why the terrain matters.',
    icon: ShieldAlert,
  },
  {
    to: '/planner',
    label: 'Step 4',
    title: 'Plan a route',
    description: 'Pick start and destination; ARES finds a safer path across the DEM.',
    icon: Route,
  },
  {
    to: '/simulator',
    label: 'Step 5',
    title: 'Simulate the walk',
    description: 'Estimate oxygen, duration and return feasibility for the planned route.',
    icon: Rocket,
  },
]

/** Public-facing mission workflow: how a visitor moves from globe to simulator. */
export function MissionWorkflowSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6">
      <SectionHeading
        eyebrow="Mission workflow"
        title="From orbit to surface walk"
        description="ARES connects global context, regional terrain, hazard assessment, route planning and mission simulation into one exploration experience."
      />
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {STEPS.map((step, i) => {
          const { icon: Icon } = step
          return (
            <li
              key={step.to}
              className="group relative rounded-xl border border-line bg-white/[0.02] p-4 transition-colors hover:border-line-strong hover:bg-white/[0.045]"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-medium text-ink-faint">{step.label}</span>
                <Icon className="size-4 text-cyan/80" aria-hidden="true" />
              </div>
              <p className="mt-2 text-sm font-medium text-ink">{step.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-dim">{step.description}</p>
              <Link
                to={step.to}
                className="mt-3 inline-flex items-center gap-1 rounded font-mono text-[10px] uppercase tracking-wider text-cyan/90 underline-offset-4 transition-colors hover:text-cyan hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70"
              >
                Open
                <ArrowRight className="size-3" />
              </Link>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
