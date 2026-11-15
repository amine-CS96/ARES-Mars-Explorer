import { Route, Send, TriangleAlert } from 'lucide-react'
import type { RouteExposureResult } from '@/engines/hazards/routeExposure'
import type { HazardCluster } from '@/engines/hazards/hazardDetection'
import { SEVERITY_COLORS, SEVERITY_LABELS, type Severity } from '@/engines/hazards/riskModel'

interface RouteExposurePanelProps {
  exposure: RouteExposureResult | null
  /** True when a route exists in storage but could not be matched to this DEM. */
  importFailed?: boolean
  routeDistanceMeters: number | null
  clusters: HazardCluster[]
  selectedClusterId: number | null
  onSelectCluster: (cluster: HazardCluster) => void
  onGoToPlanner: () => void
  onSendToSimulator: () => void
}

const EXPOSURE_SEVERITIES: Severity[] = ['critical', 'high', 'moderate', 'low', 'unknown']

function ExposureRow({ severity, pct }: { severity: Severity; pct: number }) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between text-[10px]">
        <span className="flex items-center gap-1.5 text-ink-dim">
          <span
            aria-hidden="true"
            className="inline-block size-2 rounded-full"
            style={{ backgroundColor: SEVERITY_COLORS[severity] }}
          />
          {SEVERITY_LABELS[severity]}
        </span>
        <span className="font-mono text-ink">{pct.toFixed(1)}%</span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded bg-surface-2">
        <div
          className="h-full rounded"
          style={{ width: `${Math.min(100, pct)}%`, backgroundColor: SEVERITY_COLORS[severity] }}
        />
      </div>
    </div>
  )
}

/**
 * Route exposure summary for a route imported from the Planner. All numbers come from the real
 * `computeRouteExposure` run against the active profile — never from the Planner's own summary,
 * which is recomputed here under the current profile.
 */
export function RouteExposurePanel({
  exposure,
  importFailed = false,
  routeDistanceMeters,
  clusters,
  selectedClusterId,
  onSelectCluster,
  onGoToPlanner,
  onSendToSimulator,
}: RouteExposurePanelProps) {
  if (!exposure) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-5 text-center">
        <div className="rounded-lg border border-line bg-white/[0.02] p-4">
          <Route className="mx-auto size-5 text-ink-faint" aria-hidden="true" />
          <p className="mt-2 text-[11px] font-medium text-ink-dim">No route loaded</p>
          {importFailed ? (
            <p className="mt-1.5 text-[10px] leading-relaxed text-amber">
              A route is stored but its path could not be matched to this DEM coverage. Recompute
              it in the Planner.
            </p>
          ) : (
            <p className="mt-1.5 text-[10px] leading-relaxed text-ink-faint">
              Plan a route in the Route Planner to see how it crosses detected hazards — exposed
              distance, severity mix, and intersected clusters.
            </p>
          )}
          <button
            type="button"
            onClick={onGoToPlanner}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-cyan/30 bg-cyan/10 px-3 py-1.5 text-[11px] font-medium text-cyan transition-colors hover:bg-cyan/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70"
          >
            Open Route Planner
          </button>
        </div>
      </div>
    )
  }

  const intersected = exposure.clusterIds
    .map((id) => clusters.find((c) => c.id === id))
    .filter((c): c is HazardCluster => Boolean(c))

  return (
    <div className="space-y-3.5 p-3">
      <div className="flex items-center gap-2">
        <Route className="size-4 text-cyan" aria-hidden="true" />
        <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-ink">
          Route exposure
        </h3>
        <span className="ml-auto font-mono text-[9px] text-ink-faint">from Planner</span>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        <div className="rounded border border-line bg-space/50 px-2 py-1.5">
          <p className="font-mono text-[8px] uppercase tracking-wider text-ink-faint">Distance</p>
          <p className="font-mono text-[12px] text-ink">
            {(exposure.totalDistanceM / 1000).toFixed(2)} km
          </p>
        </div>
        <div className="rounded border border-line bg-space/50 px-2 py-1.5">
          <p className="font-mono text-[8px] uppercase tracking-wider text-ink-faint">Max slope</p>
          <p className="font-mono text-[12px] text-ink">{exposure.maxSlopeDeg.toFixed(1)}°</p>
        </div>
        <div className="rounded border border-line bg-space/50 px-2 py-1.5">
          <p className="font-mono text-[8px] uppercase tracking-wider text-ink-faint">Mean risk</p>
          <p className="font-mono text-[12px] text-ink">{exposure.weightedRiskScore.toFixed(2)}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="font-mono text-[9px] uppercase tracking-wider text-ink-faint">
          Length by severity
        </p>
        {EXPOSURE_SEVERITIES.map((s) => (
          <ExposureRow key={s} severity={s} pct={exposure.severityPercent[s]} />
        ))}
      </div>

      <div>
        <p className="mb-1 font-mono text-[9px] uppercase tracking-wider text-ink-faint">
          Intersected clusters ({exposure.clusterIds.length})
        </p>
        {exposure.clusterIds.length === 0 ? (
          <p className="rounded-md border border-line bg-white/[0.02] p-2 text-[10px] leading-relaxed text-ink-dim">
            The route avoids every detected hazard cluster (≥ 0.05 km², moderate+ risk).
          </p>
        ) : (
          <div className="flex flex-wrap gap-1">
            {intersected.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelectCluster(c)}
                className={`rounded border px-1.5 py-0.5 font-mono text-[9px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70 ${
                  selectedClusterId === c.id
                    ? 'border-cyan/60 bg-cyan/10 text-cyan'
                    : 'border-line bg-white/[0.02] text-ink-dim hover:text-ink'
                }`}
                title={`${SEVERITY_LABELS[c.severity]} · ${(c.areaSqM / 1_000_000).toFixed(2)} km²`}
              >
                H{c.id}
              </button>
            ))}
          </div>
        )}
        <p className="mt-1 font-mono text-[9px] text-ink-faint">
          Intersections use cluster bounding boxes; a listed ID means the route enters that
          cluster's envelope.
        </p>
      </div>

      {routeDistanceMeters != null &&
      Math.abs(routeDistanceMeters - exposure.totalDistanceM) > 50 ? (
        <p className="flex items-start gap-1.5 rounded-md border border-amber/30 bg-amber/5 p-2 text-[10px] leading-relaxed text-amber">
          <TriangleAlert className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
          Planner reported {(routeDistanceMeters / 1000).toFixed(2)} km; recomputed straight-line
          exposure here is {(exposure.totalDistanceM / 1000).toFixed(2)} km (segment-based).
        </p>
      ) : null}

      <button
        type="button"
        onClick={onSendToSimulator}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-cyan/30 bg-cyan/10 px-3 py-1.5 text-xs font-medium text-cyan transition-colors hover:bg-cyan/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70"
      >
        <Send className="size-3.5" aria-hidden="true" />
        Send to Simulator
      </button>
    </div>
  )
}
