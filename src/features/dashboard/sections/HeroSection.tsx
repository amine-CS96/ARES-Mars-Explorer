import { Link } from 'react-router-dom'
import { ArrowRight, Rocket } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MolaMosaicStrip } from './MolaMosaicStrip'
import { MARS_MEAN_RADIUS_KM } from '@/utils/geo'

const QUICK_FACTS = [
  { label: 'Mean radius', value: `${MARS_MEAN_RADIUS_KM.toLocaleString('en-US')} km` },
  { label: 'Gravity', value: '3.71 m/s²' },
  { label: 'Sol', value: '24.66 h' },
  { label: 'Surface pressure', value: '~6.4 mbar' },
]

/** Mission Control hero: identity, honest preview of the globe, quick planetary telemetry. */
export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden="true" className="bg-grid pointer-events-none absolute inset-0 opacity-50" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 right-[-10%] size-[34rem] rounded-full bg-accent/[0.07] blur-3xl"
      />
      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pb-14 pt-12 sm:px-6 sm:pt-16 lg:grid-cols-[1.05fr_1fr]">
        <div className="animate-fade-up">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <Badge variant="cyan">NASA Space Apps Challenge 2026</Badge>
            <Badge variant="outline">Interplanetary Survival Guide · Martian Map</Badge>
          </div>
          <h1 className="font-display text-4xl font-bold tracking-wide text-ink sm:text-5xl">
            ARES
          </h1>
          <p className="mt-2 font-display text-lg font-medium tracking-[0.14em] text-accent text-glow-accent">
            Explore Mars. Plan Smarter. Survive Further.
          </p>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-ink-dim">
            A mission-control-grade platform for exploring Mars: real NASA imagery and elevation,
            terrain-hazard intelligence, safe route planning between science targets, and a
            Marswalk simulator that tells you — before the airlock opens — whether the plan
            brings the astronaut home with oxygen to spare.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link to="/atlas">
                Open the Exploration Atlas <ArrowRight />
              </Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/planner">
                <Rocket /> Plan a Marswalk
              </Link>
            </Button>
          </div>

          <dl className="mt-9 grid max-w-lg grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
            {QUICK_FACTS.map((fact) => (
              <div key={fact.label}>
                <dt className="text-[10px] font-mono uppercase tracking-[0.18em] text-ink-faint">
                  {fact.label}
                </dt>
                <dd className="mt-1 font-mono text-sm font-medium text-cyan/90">{fact.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-[11px] text-ink-faint">
            Values: NASA NSSDCA Mars Fact Sheet — full sources on the Data page.
          </p>
        </div>

        <div className="animate-fade-up" style={{ animationDelay: '120ms' }}>
          <MolaMosaicStrip />
        </div>
      </div>
    </section>
  )
}
