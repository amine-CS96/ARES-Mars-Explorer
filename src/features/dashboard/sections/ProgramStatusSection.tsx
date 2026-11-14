import { programPhases } from '@/data/program'
import { SectionHeading } from '@/components/ui/section-heading'
import { PhaseBadge } from '@/components/ui/status-badges'
import { cn } from '@/utils/cn'

/** Module A — honest development state of the ARES build program. */
export function ProgramStatusSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6">
      <SectionHeading
        eyebrow="Program status"
        title="Build phases"
        description="ARES is built in six verified phases. This timeline mirrors PROJECT_STATUS.md — no module is marked complete before it passes its acceptance criteria."
      />
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {programPhases.map((phase, i) => (
          <li
            key={phase.id}
            className={cn(
              'rounded-xl border p-4 transition-colors',
              phase.status === 'active'
                ? 'border-accent/50 bg-accent/[0.07]'
                : 'border-line bg-white/[0.02]',
            )}
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-medium text-ink-faint">
                P{phase.id}
              </span>
              <PhaseBadge status={phase.status} />
            </div>
            <p className="mt-2 text-sm font-medium text-ink">{phase.name.replace(/^Phase \d+ · /, '')}</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-dim">{phase.focus}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
