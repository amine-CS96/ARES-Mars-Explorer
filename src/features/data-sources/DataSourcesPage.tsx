import { useMemo, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { allDatasets, ATTRIBUTION_LINE, DISCLAIMER_LINE, datasetCounts } from '@/services/nasa/dataCatalog'
import type { DatasetStatus } from '@/types/dataset'
import { SectionHeading } from '@/components/ui/section-heading'
import { Badge } from '@/components/ui/badge'
import { DataKindBadge, DatasetStatusBadge } from '@/components/ui/status-badges'
import { cn } from '@/utils/cn'

const STATUS_FILTERS: Array<{ id: DatasetStatus | 'all'; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'available', label: 'Available' },
  { id: 'pending-verification', label: 'Pending check' },
  { id: 'planned', label: 'Planned' },
]

/**
 * Module H — Data Sources & Scientific Transparency. The full dataset registry with provider,
 * mission, instrument, kind, resolution, coverage and status. Unverified entries are shown as
 * pending — never presented as usable data.
 */
export function DataSourcesPage() {
  const [statusFilter, setStatusFilter] = useState<DatasetStatus | 'all'>('all')
  const counts = useMemo(() => datasetCounts(), [])

  const rows = useMemo(() => {
    const all = allDatasets()
    return statusFilter === 'all' ? all : all.filter((d) => d.status === statusFilter)
  }, [statusFilter])

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="animate-fade-up">
        <p className="eyebrow mb-2">Module H · Scientific transparency</p>
        <h1 className="font-display text-3xl font-bold tracking-wide text-ink sm:text-4xl">
          Data Sources
        </h1>
        <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-ink-dim">
          Every dataset ARES uses or plans to use, with its provider, mission, instrument,
          resolution and how it reaches you. Endpoints were verified against official
          documentation; anything not yet confirmed is labeled{' '}
          <span className="font-mono text-xs text-amber">PENDING CHECK</span> — never presented
          as usable data.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => setStatusFilter(filter.id)}
            aria-pressed={statusFilter === filter.id}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70',
              statusFilter === filter.id
                ? 'border-accent/60 bg-accent/15 text-accent-strong'
                : 'border-line text-ink-dim hover:border-line-strong hover:text-ink',
            )}
          >
            {filter.label}
            {filter.id !== 'all' ? (
              <span className="ml-1.5 font-mono text-[10px] text-ink-faint">
                {counts[filter.id]}
              </span>
            ) : null}
          </button>
        ))}
        <Badge variant="outline" className="ml-auto">
          {rows.length} / {allDatasets().length} datasets
        </Badge>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {rows.map((d) => (
          <article key={d.id} className="panel p-5">
            <div className="flex flex-wrap items-center gap-2">
              <DataKindBadge kind={d.kind} />
              <DatasetStatusBadge status={d.status} />
              <Badge variant="outline" className="ml-auto">
                Phase {d.phase}
              </Badge>
            </div>
            <h2 className="mt-3 font-display text-base font-semibold tracking-wide text-ink">
              {d.name}
            </h2>
            <dl className="mt-3 space-y-1.5 text-xs leading-relaxed">
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 font-mono uppercase tracking-wider text-ink-faint">
                  Provider
                </dt>
                <dd className="text-ink-dim">{d.provider}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-20 shrink-0 font-mono uppercase tracking-wider text-ink-faint">
                  Mission
                </dt>
                <dd className="text-ink-dim">{d.mission}</dd>
              </div>
              {d.instrument ? (
                <div className="flex gap-2">
                  <dt className="w-20 shrink-0 font-mono uppercase tracking-wider text-ink-faint">
                    Instrument
                  </dt>
                  <dd className="text-ink-dim">{d.instrument}</dd>
                </div>
              ) : null}
              {d.resolution ? (
                <div className="flex gap-2">
                  <dt className="w-20 shrink-0 font-mono uppercase tracking-wider text-ink-faint">
                    Resolution
                  </dt>
                  <dd className="font-mono text-cyan/90">{d.resolution}</dd>
                </div>
              ) : null}
              {d.coverage ? (
                <div className="flex gap-2">
                  <dt className="w-20 shrink-0 font-mono uppercase tracking-wider text-ink-faint">
                    Coverage
                  </dt>
                  <dd className="text-ink-dim">{d.coverage}</dd>
                </div>
              ) : null}
            </dl>
            {d.notes ? (
              <p className="mt-3 rounded-lg border border-line/60 bg-white/[0.02] p-3 text-[11px] leading-relaxed text-ink-faint">
                {d.notes}
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] text-ink-faint">Credit: {d.credit}</p>
              {d.url ? (
                <a
                  href={d.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1.5 rounded font-mono text-[11px] uppercase tracking-wider text-cyan/90 underline-offset-4 transition-colors hover:text-cyan hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70"
                >
                  <ExternalLink className="size-3" />
                  Source
                </a>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      <div className="panel mt-10 p-6">
        <SectionHeading eyebrow="Attribution" title="Credits" className="mb-3" />
        <p className="max-w-4xl text-sm leading-relaxed text-ink-dim">{ATTRIBUTION_LINE}</p>
        <p className="mt-2 max-w-4xl text-sm leading-relaxed text-ink-dim">
          References studied during development: NASA Mars Trek (tile services and API docs) and
          the Sol Atlas project (Apache-2.0) — architectural inspiration only; no code was copied.
          Fonts and libraries are credited in docs/DATA_SOURCES.md.
        </p>
        <p className="mt-4 max-w-4xl rounded-lg border border-amber/25 bg-amber/[0.06] p-3 text-xs leading-relaxed text-amber/90">
          {DISCLAIMER_LINE} Outputs shown in route and simulation modules are planning estimates
          with published assumptions, not certified values.
        </p>
        <p className="mt-3 text-[11px] text-ink-faint">
          Status legend: <span className="text-success">AVAILABLE</span> = verified live from this
          environment · <span className="text-amber">PENDING CHECK</span> = catalog-confirmed,
          endpoint details still to be derived · <span className="text-ink-dim">PLANNED</span> = on
          the roadmap for a later phase.
        </p>
      </div>
    </div>
  )
}
