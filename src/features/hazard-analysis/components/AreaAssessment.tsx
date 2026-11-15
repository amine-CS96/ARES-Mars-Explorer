import type { HazardDetectionResult } from '@/engines/hazards/hazardDetection'
import { SEVERITY_COLORS, SEVERITY_LABELS, type Severity } from '@/engines/hazards/riskModel'

interface AreaAssessmentProps {
  result: HazardDetectionResult
  totalAreaSqM: number
}

function StatBox({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded border border-line bg-space/50 px-2.5 py-2">
      <p className="font-mono text-[9px] uppercase tracking-wider text-ink-faint">{label}</p>
      <p className="font-mono text-sm text-ink">{value}</p>
      {note ? <p className="font-mono text-[9px] text-ink-faint">{note}</p> : null}
    </div>
  )
}

export function AreaAssessment({ result, totalAreaSqM }: AreaAssessmentProps) {
  const totalCells = result.validCellCount + result.nodataCellCount
  const validPct = totalCells > 0 ? (result.validCellCount / totalCells) * 100 : 0
  const nodataPct = totalCells > 0 ? (result.nodataCellCount / totalCells) * 100 : 0

  const severityAreaSqM: Record<Severity, number> = {
    low: 0,
    moderate: 0,
    high: 0,
    critical: 0,
    unknown: 0,
  }
  for (const s of Object.keys(result.severityCounts) as Severity[]) {
    severityAreaSqM[s] = (result.severityCounts[s] / totalCells) * totalAreaSqM
  }

  return (
    <div className="space-y-4 p-4">
      <div>
        <h3 className="font-display text-sm font-semibold tracking-wide text-ink">Area assessment</h3>
        <p className="mt-1 text-[10px] leading-relaxed text-ink-dim">
          Statistics for the entire DEM coverage. Values are derived from the CTX 20 m DEM.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatBox label="Total area" value={`${(totalAreaSqM / 1_000_000).toFixed(2)} km²`} />
        <StatBox label="Valid coverage" value={`${validPct.toFixed(1)}%`} note="analyzed" />
        <StatBox label="Nodata" value={`${nodataPct.toFixed(1)}%`} note="boundary / missing" />
        <StatBox label="Clusters" value={`${result.clusters.length}`} note="moderate+ risk" />
      </div>

      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-wider text-ink-faint">Severity distribution</p>
        {(['critical', 'high', 'moderate', 'low', 'unknown'] as Severity[]).map((s) => {
          const pct = totalCells > 0 ? (result.severityCounts[s] / totalCells) * 100 : 0
          return (
            <div key={s} className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="flex items-center gap-1.5 text-ink-dim">
                  <span
                    aria-hidden="true"
                    className="inline-block size-2 rounded-full"
                    style={{ backgroundColor: SEVERITY_COLORS[s] }}
                  />
                  {SEVERITY_LABELS[s]}
                </span>
                <span className="font-mono text-ink-faint">{pct.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded bg-surface-2">
                <div
                  className="h-full rounded"
                  style={{ width: `${pct}%`, backgroundColor: SEVERITY_COLORS[s] }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
