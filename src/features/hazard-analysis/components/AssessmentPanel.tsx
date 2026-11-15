import { Info } from 'lucide-react'
import type { HazardDetectionResult } from '@/engines/hazards/hazardDetection'
import type { TerrainAnalysis } from '@/engines/hazards/terrainAnalysis'
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  SEVERITY_COLORS,
  SEVERITY_LABELS,
  MOBILITY_PROFILES,
  type HazardCategory,
  type Severity,
} from '@/engines/hazards/riskModel'
import type { ProfileAccessibility } from '@/engines/hazards/accessibility'

interface AssessmentPanelProps {
  detection: HazardDetectionResult
  analysis: TerrainAnalysis
  totalAreaSqM: number
  /** Current profile's accessibility (recomputed live with the profile). */
  currentAccessibility: ProfileAccessibility | null
  /** Precomputed accessibility for all profiles (memoized once per analysis). */
  allAccessibility: ProfileAccessibility[]
}

const SEVERITY_ROWS: Severity[] = ['critical', 'high', 'moderate', 'low', 'unknown']
const CATEGORY_ROWS: HazardCategory[] = [
  'very_steep',
  'steep_slope',
  'high_roughness',
  'high_relief',
  'uncertain_data',
]

function StatBox({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded border border-line bg-space/50 px-2.5 py-2">
      <p className="font-mono text-[9px] uppercase tracking-wider text-ink-faint">{label}</p>
      <p className="font-mono text-sm text-ink">{value}</p>
      {note ? <p className="font-mono text-[9px] text-ink-faint">{note}</p> : null}
    </div>
  )
}

function pctLabel(pct: number): string {
  // Keep small-but-real fractions visible instead of rounding them to 0.0%.
  return pct > 0 && pct < 0.1 ? pct.toFixed(2) : pct.toFixed(1)
}

function DistributionBar({
  label,
  color,
  pct,
  detail,
}: {
  label: string
  color: string
  pct: number
  detail: string
}) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between text-[10px]">
        <span className="flex items-center gap-1.5 text-ink-dim">
          <span
            aria-hidden="true"
            className="inline-block size-2 rounded-full shrink-0"
            style={{ backgroundColor: color }}
          />
          {label}
        </span>
        <span className="font-mono text-ink-faint">{detail}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded bg-surface-2">
        <div
          className="h-full rounded"
          style={{ width: `${Math.max(0.5, pct)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

/**
 * Regional assessment: severity distribution, dominant hazard factors, and mobility-profile
 * comparison. All values derive from the real per-cell analysis; the profile comparison comes
 * from the same `assessCellRisk` math applied across every mobility profile.
 */
export function AssessmentPanel({
  detection,
  analysis,
  totalAreaSqM,
  currentAccessibility,
  allAccessibility,
}: AssessmentPanelProps) {
  const totalCells = detection.validCellCount + detection.nodataCellCount
  const validPct = totalCells > 0 ? (detection.validCellCount / totalCells) * 100 : 0
  const nodataPct = totalCells > 0 ? (detection.nodataCellCount / totalCells) * 100 : 0

  const severityAreaSqKm = (s: Severity) =>
    (detection.severityCounts[s] / totalCells) * (totalAreaSqM / 1_000_000)

  const dominantCategory = CATEGORY_ROWS.reduce<HazardCategory>(
    (best, c) =>
      detection.categoryCounts[c] > detection.categoryCounts[best] ? c : best,
    'very_steep',
  )

  const cellAreaSqM = analysis.metersPerPixel * analysis.metersPerPixel

  return (
    <div className="space-y-4 p-3">
      {/* Regional assessment */}
      <section>
        <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-ink">
          Regional assessment
        </h3>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <StatBox
            label="DEM coverage"
            value={`${(totalAreaSqM / 1_000_000).toFixed(0)} km²`}
            note={`${analysis.width}×${analysis.height} px @ ${analysis.metersPerPixel.toFixed(1)} m`}
          />
          <StatBox
            label="Valid cells"
            value={`${validPct.toFixed(1)}%`}
            note={`nodata ${nodataPct.toFixed(1)}%`}
          />
          <StatBox
            label="Clusters"
            value={`${detection.clusters.length}`}
            note="moderate+ risk regions"
          />
          <StatBox
            label="Dominant factor"
            value={CATEGORY_LABELS[dominantCategory]}
            note={`${detection.categoryCounts[dominantCategory]} cells`}
          />
        </div>
      </section>

      {/* Severity distribution */}
      <section>
        <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-ink">
          Severity distribution
        </h3>
        <p className="mt-0.5 font-mono text-[9px] text-ink-faint">
          Cell count and area per severity class
        </p>
        <div className="mt-2 space-y-1.5">
          {SEVERITY_ROWS.map((s) => {
            const count = detection.severityCounts[s]
            const pct = totalCells > 0 ? (count / totalCells) * 100 : 0
            return (
              <DistributionBar
                key={s}
                label={SEVERITY_LABELS[s]}
                color={SEVERITY_COLORS[s]}
                pct={pct}
                detail={`${pctLabel(pct)}% · ${severityAreaSqKm(s).toFixed(1)} km²`}
              />
            )
          })}
        </div>
      </section>

      {/* Dominant factors */}
      <section>
        <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-ink">
          Dominant factors
        </h3>
        <div className="mt-2 space-y-1.5">
          {CATEGORY_ROWS.map((c) => {
            const count = detection.categoryCounts[c]
            const pct = totalCells > 0 ? (count / totalCells) * 100 : 0
            return (
              <DistributionBar
                key={c}
                label={CATEGORY_LABELS[c]}
                color={CATEGORY_COLORS[c]}
                pct={pct}
                detail={`${pctLabel(pct)}% · ${count} cells`}
              />
            )
          })}
        </div>
      </section>

      {/* Accessible vs restricted (current profile) */}
      {currentAccessibility ? (
        <section>
          <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-ink">
            Accessible vs restricted
          </h3>
          <p className="mt-0.5 font-mono text-[9px] text-ink-faint">
            Per-cell classification under the active profile
          </p>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            <StatBox
              label="Accessible (low)"
              value={`${pctLabel(currentAccessibility.accessibleFraction * 100)}%`}
              note={`${currentAccessibility.accessibleCells.toLocaleString('en-US')} cells`}
            />
            <StatBox
              label="Restricted (moderate+)"
              value={`${pctLabel(currentAccessibility.restrictedFraction * 100)}%`}
              note={`${currentAccessibility.restrictedCells.toLocaleString('en-US')} cells`}
            />
            <StatBox
              label="Accessible area"
              value={`${((currentAccessibility.accessibleCells * cellAreaSqM) / 1_000_000).toFixed(1)} km²`}
            />
            <StatBox
              label="Restricted area"
              value={`${((currentAccessibility.restrictedCells * cellAreaSqM) / 1_000_000).toFixed(1)} km²`}
            />
          </div>
        </section>
      ) : null}

      {/* Mobility profile comparison */}
      <section>
        <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-ink">
          Mobility profile comparison
        </h3>
        <p className="mt-0.5 font-mono text-[9px] text-ink-faint">
          Restricted share of the DEM per profile
        </p>
        <div className="mt-2 space-y-1.5">
          {allAccessibility.map((a) => {
            const profile = MOBILITY_PROFILES.find((p) => p.id === a.profileId)
            if (!profile) return null
            const pct = a.restrictedFraction * 100
            return (
              <DistributionBar
                key={a.profileId}
                label={profile.name.replace(' rover', '').replace(' explorer', '')}
                color="#53d6e8"
                pct={pct}
                detail={`${pctLabel(pct)}% restricted`}
              />
            )
          })}
        </div>
      </section>

      {/* Limitations */}
      <section className="rounded-lg border border-line bg-white/[0.02] p-2.5">
        <h3 className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-amber">
          <Info className="size-3" aria-hidden="true" />
          Limitations
        </h3>
        <ul className="mt-1.5 list-disc space-y-1 pl-4 text-[10px] leading-relaxed text-ink-dim">
          <li>
            20 m DEM resolution: sub-20 m obstacles (individual boulders) are not resolved;
            roughness is terrain-derived, not rock detection.
          </li>
          <li>
            Cluster metrics summarize bounding boxes of member cells; irregular shapes are
            approximated by their extents.
          </li>
          <li>
            Mobility profiles are educational planning assumptions, not official rover
            specifications.
          </li>
          <li>Planning estimates only — not certified traversability products.</li>
        </ul>
      </section>
    </div>
  )
}
