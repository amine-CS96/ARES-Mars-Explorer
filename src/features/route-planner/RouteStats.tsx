import { AlertTriangle, Navigation, Route, TrendingUp, Zap } from 'lucide-react'
import type { RouteState } from './useRoutePlanner'
import { SLOPE_CLASS_COLORS } from '@/engines/terrain/slopeClass'

interface RouteStatsProps {
  routeState: RouteState
}

export function RouteStats({ routeState }: RouteStatsProps) {
  const { primarySummary, alternativeSummary, explanation, difficulty, loading, error } = routeState

  if (loading) {
    return (
      <div className="rounded-xl border border-line bg-surface/50 p-4 text-ink-dim">
        <p className="flex items-center gap-2 font-mono text-xs">
          <span className="inline-block size-3 animate-spin rounded-full border-2 border-cyan/30 border-t-cyan" />
          Calculating route over the DEM cost grid…
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-danger">
        <p className="flex items-center gap-2 font-mono text-xs">
          <AlertTriangle className="size-4" aria-hidden="true" />
          {error}
        </p>
      </div>
    )
  }

  if (!primarySummary) {
    return (
      <div className="rounded-xl border border-line bg-surface/50 p-4 text-ink-dim">
        <p className="font-mono text-xs">
          Click the map to set a start point, then click again to set a destination. The planner
          uses the real Jezero CTX 20 m DEM.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3 rounded-xl border border-line bg-surface/50 p-4">
      <div className="flex items-center gap-2">
        <Navigation className="size-4 text-cyan" aria-hidden="true" />
        <h3 className="font-display text-sm font-semibold tracking-wide text-ink">Recommended route</h3>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatBox label="Distance" value={`${(primarySummary.distanceMeters / 1000).toFixed(2)} km`} />
        <StatBox
          label="Est. energy"
          value={`${(primarySummary.cost / 1000).toFixed(1)} kJ`}
          note="derived"
        />
        <StatBox label="Max slope" value={`${primarySummary.maxSlopeDeg.toFixed(1)}°`} />
        <StatBox label="Avg slope" value={`${primarySummary.averageSlopeDeg.toFixed(1)}°`} />
      </div>

      {difficulty ? (
        <div className="space-y-1.5">
          <p className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">Terrain along route</p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['flat', 'Flat'],
                ['moderate', 'Moderate'],
                ['steep', 'Steep'],
                ['hazardous', 'Hazardous'],
              ] as const
            ).map(([key, label]) => (
              <span
                key={key}
                className="flex items-center gap-1 rounded border border-line bg-space/50 px-2 py-1 font-mono text-[10px] text-ink-dim"
              >
                <span
                  aria-hidden="true"
                  className="inline-block size-2 rounded-full"
                  style={{ backgroundColor: SLOPE_CLASS_COLORS[key] }}
                />
                {label}: {difficulty[key]}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {alternativeSummary ? (
        <div className="space-y-1 border-t border-line pt-3">
          <div className="flex items-center gap-2">
            <Route className="size-4 text-amber" aria-hidden="true" />
            <h3 className="font-display text-sm font-semibold tracking-wide text-ink">Alternative route</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatBox label="Distance" value={`${(alternativeSummary.distanceMeters / 1000).toFixed(2)} km`} />
            <StatBox label="Est. energy" value={`${(alternativeSummary.cost / 1000).toFixed(1)} kJ`} />
            <StatBox label="Max slope" value={`${alternativeSummary.maxSlopeDeg.toFixed(1)}°`} />
          </div>
        </div>
      ) : null}

      {explanation ? (
        <div className="space-y-1 border-t border-line pt-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-success" aria-hidden="true" />
            <h3 className="font-display text-sm font-semibold tracking-wide text-ink">Why this route?</h3>
          </div>
          <p className="text-[12px] leading-relaxed text-ink-dim">{explanation.primaryText}</p>
          {explanation.comparisonText ? (
            <p className="text-[12px] leading-relaxed text-ink-dim">{explanation.comparisonText}</p>
          ) : null}
          {explanation.cautionText ? (
            <p className="flex items-start gap-2 text-[12px] leading-relaxed text-amber">
              <Zap className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              {explanation.cautionText}
            </p>
          ) : null}
        </div>
      ) : null}

      <p className="border-t border-line pt-2 font-mono text-[9px] leading-relaxed text-ink-faint">
        Energy is a planning estimate from the Pandolf cost model (Mars gravity + suit penalty).
        It is not a certified life-support or rover-traversability verdict.
      </p>
    </div>
  )
}

function StatBox({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded border border-line bg-space/50 px-2.5 py-2">
      <p className="font-mono text-[9px] uppercase tracking-wider text-ink-faint">{label}</p>
      <p className="font-mono text-sm text-ink">{value}</p>
      {note ? <p className="font-mono text-[9px] text-ink-faint">({note})</p> : null}
    </div>
  )
}
