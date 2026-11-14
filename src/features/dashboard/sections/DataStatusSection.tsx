import { Link } from 'react-router-dom'
import { getDataset } from '@/services/nasa/dataCatalog'
import { SectionHeading } from '@/components/ui/section-heading'
import { DataKindBadge, DatasetStatusBadge } from '@/components/ui/status-badges'

const FEATURED_DATASETS = [
  'mars-trek-wmts',
  'mola-clr-shade-463m',
  'viking-mdim21-232m',
  'mmgis-m20-waypoints',
  'nssdc-mars-facts',
  'jezero-hirise-25cm',
] as const

/** Module A → Module H bridge: the data spine of ARES, visible from the first screen. */
export function DataStatusSection() {
  const rows = FEATURED_DATASETS.map((id) => getDataset(id)).filter(
    (d): d is NonNullable<typeof d> => d !== undefined,
  )

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6">
      <SectionHeading
        eyebrow="Data & sources"
        title="The data spine"
        description="Only verified or explicitly-labeled datasets are listed here. Kind badges say exactly what you are looking at — static product, snapshot, portal or planned."
        action={
          <Link
            to="/data-sources"
            className="rounded-lg font-mono text-xs uppercase tracking-wider text-cyan/90 underline-offset-4 transition-colors hover:text-cyan hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70"
          >
            Full registry →
          </Link>
        }
      />
      <div className="panel divide-y divide-line/70 overflow-hidden">
        {rows.map((d) => (
          <div
            key={d.id}
            className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 transition-colors hover:bg-white/[0.02]"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{d.name}</p>
              <p className="truncate text-xs text-ink-faint">
                {d.provider}
                {d.instrument ? ` · ${d.instrument}` : ''}
              </p>
            </div>
            {d.resolution ? (
              <span className="font-mono text-xs text-cyan/90">{d.resolution}</span>
            ) : null}
            <DataKindBadge kind={d.kind} />
            <DatasetStatusBadge status={d.status} />
          </div>
        ))}
      </div>
    </section>
  )
}
