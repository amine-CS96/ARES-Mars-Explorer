import { Construction, Layers } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SectionHeading } from '@/components/ui/section-heading'

interface ModuleStatusPageProps {
  eyebrow: string
  title: string
  moduleCode: string
  phase: number
  description: string
  plannedFeatures: Array<{ icon: LucideIcon; text: string }>
  dataBasis: string
}

/**
 * Honest per-module status page used until a module's phase ships. It describes exactly what
 * will arrive and on which data — never a fake UI.
 */
export function ModuleStatusPage({
  eyebrow,
  title,
  moduleCode,
  phase,
  description,
  plannedFeatures,
  dataBasis,
}: ModuleStatusPageProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="animate-fade-up">
        <p className="eyebrow mb-2">{eyebrow}</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-bold tracking-wide text-ink sm:text-4xl">
            {title}
          </h1>
          <Badge variant="outline">
            {moduleCode} · Phase {phase}
          </Badge>
        </div>
        <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-ink-dim">{description}</p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="panel animate-fade-up p-6" style={{ animationDelay: '80ms' }}>
          <SectionHeading
            eyebrow="On the roadmap"
            title="What this module will ship"
            className="mb-4"
          />
          <ul className="grid gap-3 sm:grid-cols-2">
            {plannedFeatures.map(({ icon: Icon, text }) => (
              <li
                key={text}
                className="flex items-start gap-3 rounded-lg border border-line/60 bg-white/[0.02] p-3"
              >
                <Icon className="mt-0.5 size-4 shrink-0 text-cyan" />
                <span className="text-sm leading-relaxed text-ink-dim">{text}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 flex items-center gap-2 text-xs text-ink-faint">
            <Construction className="size-3.5" />
            Under active development — phases and acceptance criteria are tracked in
            PROJECT_STATUS.md and docs/DEVELOPMENT_ROADMAP.md.
          </p>
        </div>

        <div className="panel-elevated animate-fade-up p-6" style={{ animationDelay: '160ms' }}>
          <SectionHeading eyebrow="Data basis" title="Planned sources" className="mb-4" />
          <div className="flex items-start gap-3">
            <Layers className="mt-0.5 size-4 shrink-0 text-accent" />
            <p className="text-sm leading-relaxed text-ink-dim">{dataBasis}</p>
          </div>
          <p className="mt-5 text-xs leading-relaxed text-ink-faint">
            ARES only displays layers whose endpoints were verified or explicitly labeled as
            pending — no fabricated data, ever.
          </p>
          <Button variant="secondary" size="sm" className="mt-4" asChild>
            <Link to="/data-sources">Inspect the data registry</Link>
          </Button>
        </div>
      </div>

      <p className="mt-8 text-xs text-ink-faint">
        Tip: the Atlas and Data pages are already live — they run on the verified Phase 1 data
        catalog.
      </p>
    </div>
  )
}
