import { marsFacts, MARS_FACTS_SOURCE } from '@/data/planetaryFacts'
import { SectionHeading } from '@/components/ui/section-heading'

/** Module A — planetary telemetry from the NASA NSSDCA fact sheet, source visible. */
export function PlanetaryStatsSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6">
      <SectionHeading
        eyebrow="Planetary telemetry"
        title="Mars by the numbers"
        description="Reference values for mission planning context — rounded to the precision published by NASA NSSDCA."
      />
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line/60 sm:grid-cols-3 lg:grid-cols-4">
        {marsFacts.map((fact) => (
          <div key={fact.label} className="bg-surface/90 p-4">
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-ink-faint">
              {fact.label}
            </p>
            <p className="mt-1.5 font-mono text-[15px] font-medium text-cyan/90">{fact.value}</p>
            {fact.note ? <p className="mt-1 text-[11px] text-ink-faint">{fact.note}</p> : null}
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-ink-faint">
        Source:{' '}
        <a
          href={MARS_FACTS_SOURCE.url}
          target="_blank"
          rel="noreferrer noopener"
          className="underline-offset-4 transition-colors hover:text-cyan hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70"
        >
          {MARS_FACTS_SOURCE.label}
        </a>{' '}
        (verified 2026-11-14).
      </p>
    </section>
  )
}
