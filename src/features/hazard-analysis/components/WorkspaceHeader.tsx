import { BookOpen, RotateCcw, TriangleAlert } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { HazardDetectionResult } from '@/engines/hazards/hazardDetection'
import { SEVERITY_COLORS, type MobilityProfile } from '@/engines/hazards/riskModel'
import { ExportMenu } from './ExportMenu'
import type { AnalysisExportInput } from '../exportAnalysis'

interface WorkspaceHeaderProps {
  detection: HazardDetectionResult | null
  coveragePct: number
  affectedAreaSqKm: number
  profile: MobilityProfile
  analysisBusy: boolean
  onReset: () => void
  onOpenMethodology: () => void
  exportInput: AnalysisExportInput | null
  tileFailures: number
}

function MetricChip({
  label,
  value,
  color,
  title,
}: {
  label: string
  value: string
  color?: string
  title?: string
}) {
  return (
    <div
      className="flex min-w-[68px] flex-col rounded-lg border border-line bg-white/[0.03] px-2.5 py-1"
      title={title}
    >
      <span className="font-mono text-[9px] uppercase tracking-wider text-ink-faint">{label}</span>
      <span
        className={cn('font-mono text-sm font-medium leading-tight', color ? '' : 'text-ink')}
        style={color ? { color } : undefined}
      >
        {value}
      </span>
    </div>
  )
}

export function WorkspaceHeader({
  detection,
  coveragePct,
  affectedAreaSqKm,
  profile,
  analysisBusy,
  onReset,
  onOpenMethodology,
  exportInput,
  tileFailures,
}: WorkspaceHeaderProps) {
  const critical = detection?.severityCounts.critical ?? 0
  const high = detection?.severityCounts.high ?? 0
  const total = detection?.clusters.length ?? 0

  return (
    <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-space/95 px-4 py-2 backdrop-blur-md">
      {/* Identity */}
      <div className="flex min-w-0 items-center gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate font-display text-base font-bold tracking-wide text-ink">
              Hazard Analysis
            </h1>
            <span className="hidden rounded border border-line bg-white/[0.03] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-ink-dim sm:inline">
              Jezero Crater
            </span>
          </div>
          <p className="truncate font-mono text-[9px] text-ink-faint">
            USGS Mars 2020 TRN CTX DTM · 20 m/px · MOLA areoid
          </p>
        </div>
      </div>

      {/* Live metrics */}
      <div className="flex flex-1 flex-wrap items-center gap-1.5">
        <MetricChip
          label="Clusters"
          value={detection ? `${total}` : '—'}
          title="Detected hazard clusters (moderate+ risk, ≥ 0.05 km²)"
        />
        <MetricChip
          label="Critical"
          value={detection ? `${critical}` : '—'}
          color={SEVERITY_COLORS.critical}
        />
        <MetricChip
          label="High"
          value={detection ? `${high}` : '—'}
          color={SEVERITY_COLORS.high}
        />
        <MetricChip
          label="Affected"
          value={detection ? `${affectedAreaSqKm.toFixed(1)} km²` : '—'}
          title="Total area covered by detected hazard clusters"
        />
        <MetricChip
          label="Coverage"
          value={detection ? `${coveragePct.toFixed(1)}%` : '—'}
          title="Share of DEM cells with valid analyzed data"
        />
        <MetricChip
          label="Profile"
          value={analysisBusy ? 'computing…' : profile.name.replace(' rover', '').replace(' explorer', '')}
          title={`Active mobility profile: ${profile.name}`}
        />
      </div>

      {/* Status flags */}
      <div className="flex items-center gap-2">
        {analysisBusy ? (
          <span className="flex items-center gap-1.5 rounded-lg border border-amber/30 bg-amber/10 px-2 py-1 font-mono text-[10px] text-amber">
            <span className="inline-block size-1.5 animate-pulse-soft rounded-full bg-amber" aria-hidden="true" />
            Analyzing DEM…
          </span>
        ) : null}
        {tileFailures > 0 ? (
          <span
            className="flex items-center gap-1.5 rounded-lg border border-amber/30 bg-amber/5 px-2 py-1 font-mono text-[10px] text-amber"
            title="Some base-map tiles could not be fetched; they are shown dark, not substituted."
          >
            <TriangleAlert className="size-3" aria-hidden="true" />
            {tileFailures} tiles unavailable
          </span>
        ) : null}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onOpenMethodology}
          className="flex items-center gap-1.5 rounded-lg border border-line bg-white/[0.03] px-2.5 py-1.5 text-xs text-ink-dim transition-colors hover:bg-white/[0.06] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70"
          aria-label="Open methodology and data provenance"
        >
          <BookOpen className="size-3.5" aria-hidden="true" />
          <span className="hidden md:inline">Methodology</span>
        </button>
        <ExportMenu input={exportInput} />
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1.5 rounded-lg border border-line bg-white/[0.03] px-2.5 py-1.5 text-xs text-ink-dim transition-colors hover:bg-white/[0.06] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70"
          aria-label="Reset analysis view"
        >
          <RotateCcw className="size-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>
    </header>
  )
}
