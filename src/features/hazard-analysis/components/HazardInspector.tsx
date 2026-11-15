import { ArrowLeft, Compass, MapPinned } from 'lucide-react'
import { formatLatLon, haversineDistanceKm } from '@/utils/geo'
import type { HazardCluster } from '@/engines/hazards/hazardDetection'
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  SEVERITY_COLORS,
  SEVERITY_LABELS,
  computeFactorContributions,
  explainCellRisk,
  type MobilityProfile,
} from '@/engines/hazards/riskModel'
import { places } from '@/data/places'
import type { LatLon } from '@/types/geo'

interface HazardInspectorProps {
  cluster: HazardCluster | null
  point: { lat: number; lon: number } | null
  pointSample: {
    elevation: number
    slope: number
    tri: number
    roughness: number
    relief: number
    aspect: number
    valid: boolean
  } | null
  profile: MobilityProfile
  onBack: () => void
  onPlanRoute: (cluster: HazardCluster) => void
}

const JEZERO_POI_IDS = [
  'octavia-e-butler-landing',
  'three-forks-sample-depot',
  'seitah',
  'jezero-delta-front',
  'jezero-crater',
]

function nearestVerifiedPois(point: LatLon, limit = 3) {
  const jezero = places.filter(
    (p) => JEZERO_POI_IDS.includes(p.id) || p.region === 'jezero-crater',
  )
  return jezero
    .map((p) => ({
      name: p.name,
      distanceKm: haversineDistanceKm(point, p.coordinates),
      accuracy: p.accuracy,
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit)
}

function CoordinateRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="font-mono text-[9px] uppercase tracking-wider text-ink-faint">{label}</span>
      <span className="font-mono text-[11px] text-cyan/90">{value}</span>
    </div>
  )
}

function StatCell({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="rounded border border-line bg-space/50 px-2 py-1.5">
      <p className="font-mono text-[8px] uppercase tracking-wider text-ink-faint">{label}</p>
      <p className="font-mono text-[12px] text-ink">
        {Number.isFinite(value) ? value.toFixed(1) : '—'}
        <span className="ml-0.5 text-[9px] text-ink-dim">{unit}</span>
      </p>
    </div>
  )
}

/** Horizontal contribution bar with the model's real weighted value. */
function ContributionBar({
  label,
  measured,
  unit,
  rampScore,
  weighted,
  weight,
  color,
}: {
  label: string
  measured: number
  unit: string
  rampScore: number
  weighted: number
  weight: number
  color: string
}) {
  const pct = Math.round(weighted * 100)
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[10px] text-ink-dim">{label}</span>
        <span className="font-mono text-[10px] text-ink">
          {measured.toFixed(1)} {unit}
          <span className="ml-1.5 text-ink-faint">
            {rampScore > 0 ? `ramp ${rampScore.toFixed(2)} × w ${weight} = ${pct}%` : 'below threshold'}
          </span>
        </span>
      </div>
      <div className="mt-0.5 h-1 w-full overflow-hidden rounded bg-surface-2">
        <div
          className="h-full rounded transition-[width] duration-300"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

/**
 * Full inspector view. Shows measured terrain values, the model-derived classification, and an
 * explainable per-factor breakdown computed with the exact same ramp math as the risk engine.
 */
export function HazardInspector({
  cluster,
  point,
  pointSample,
  profile,
  onBack,
  onPlanRoute,
}: HazardInspectorProps) {
  const severityColor = cluster ? SEVERITY_COLORS[cluster.severity] : undefined

  // Worst-case factor contributions from real cluster maxima through the real ramp.
  const worst = cluster
    ? computeFactorContributions(
        cluster.stats.maxSlopeDeg,
        cluster.stats.maxRoughnessM,
        cluster.stats.maxReliefM,
        profile,
      )
    : null

  const nearestPois = cluster ? nearestVerifiedPois(cluster.centroid) : []

  const explanation = cluster
    ? explainCellRisk(
        {
          category: cluster.category,
          score: cluster.maxScore,
          severity: cluster.severity,
          contributions: worst
            ? { slope: worst.slope, roughness: worst.roughness, relief: worst.relief }
            : { slope: 0, roughness: 0, relief: 0 },
        },
        profile,
      )
    : ''

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-line px-3 py-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[11px] text-cyan transition-colors hover:bg-cyan/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Back to inventory
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-3">
        {/* Selected cluster */}
        {cluster ? (
          <>
            <section className="rounded-xl border border-line bg-white/[0.02] p-3">
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 font-display text-sm font-bold text-ink">
                  <span
                    aria-hidden="true"
                    className="inline-block size-2.5 rounded-full"
                    style={{ backgroundColor: severityColor }}
                  />
                  Hazard H{cluster.id}
                </span>
                <span
                  className="rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider"
                  style={{ backgroundColor: `${severityColor}22`, color: severityColor }}
                >
                  {SEVERITY_LABELS[cluster.severity]}
                </span>
              </div>

              <div className="space-y-1">
                <CoordinateRow
                  label="Centroid"
                  value={formatLatLon(cluster.centroid, { decimals: 5 })}
                />
                <CoordinateRow
                  label="Area"
                  value={`${(cluster.areaSqM / 1_000_000).toFixed(3)} km² · ${cluster.cellCount} cells`}
                />
                <CoordinateRow
                  label="Dominant factor"
                  value={CATEGORY_LABELS[cluster.category]}
                />
                <CoordinateRow
                  label="Risk score"
                  value={`max ${cluster.maxScore.toFixed(2)} · mean ${cluster.meanScore.toFixed(2)}`}
                />
              </div>

              {/* Measured terrain characteristics */}
              <div className="mt-3 grid grid-cols-3 gap-1.5 border-t border-line/70 pt-2.5">
                <StatCell label="Max slope" value={cluster.stats.maxSlopeDeg} unit="°" />
                <StatCell label="Mean slope" value={cluster.stats.meanSlopeDeg} unit="°" />
                <StatCell label="Max rough" value={cluster.stats.maxRoughnessM} unit="m" />
                <StatCell label="Mean rough" value={cluster.stats.meanRoughnessM} unit="m" />
                <StatCell label="Max relief" value={cluster.stats.maxReliefM} unit="m" />
                <StatCell label="Elev range" value={cluster.stats.maxElevationM - cluster.stats.minElevationM} unit="m" />
              </div>
              <p className="mt-1.5 font-mono text-[9px] text-ink-faint">
                Elevation {cluster.stats.minElevationM.toFixed(0)} to{' '}
                {cluster.stats.maxElevationM.toFixed(0)} m (MOLA) · measured from DEM
              </p>
            </section>

            {/* Explainable classification */}
            <section className="rounded-xl border border-line bg-white/[0.02] p-3">
              <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-cyan/90">
                Why {SEVERITY_LABELS[cluster.severity].toLowerCase()}?
              </h3>
              <p className="text-[11px] leading-relaxed text-ink-dim">{explanation}</p>

              <div className="mt-3 space-y-2.5">
                <ContributionBar
                  label="Slope"
                  measured={cluster.stats.maxSlopeDeg}
                  unit="°"
                  rampScore={worst?.slope ?? 0}
                  weighted={worst?.weighted.slope ?? 0}
                  weight={profile.weights.slope}
                  color={CATEGORY_COLORS.very_steep}
                />
                <ContributionBar
                  label="Roughness"
                  measured={cluster.stats.maxRoughnessM}
                  unit="m σz"
                  rampScore={worst?.roughness ?? 0}
                  weighted={worst?.weighted.roughness ?? 0}
                  weight={profile.weights.roughness}
                  color={CATEGORY_COLORS.high_roughness}
                />
                <ContributionBar
                  label="Local relief"
                  measured={cluster.stats.maxReliefM}
                  unit="m"
                  rampScore={worst?.relief ?? 0}
                  weighted={worst?.weighted.relief ?? 0}
                  weight={profile.weights.relief}
                  color={CATEGORY_COLORS.high_relief}
                />
              </div>

              <p className="mt-3 rounded-md border border-line bg-space/40 p-2 font-mono text-[9px] leading-relaxed text-ink-faint">
                Contributions computed at the cluster's worst cell using the{' '}
                {profile.name.toLowerCase()} thresholds (slope {profile.slopeModerateDeg}°,
                roughness {profile.roughnessThresholdM} m, relief {profile.reliefThresholdM} m).
                Ramp score 0 at threshold → 1 at 2× threshold; weighted = ramp × profile weight.
              </p>
            </section>

            {/* Geographic context — computed from real coordinates only */}
            <section className="rounded-xl border border-line bg-white/[0.02] p-3">
              <h3 className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-cyan/90">
                <Compass className="size-3" aria-hidden="true" />
                Geographic context
              </h3>
              <div className="space-y-1.5">
                {nearestPois.map((poi) => (
                  <div key={poi.name} className="flex items-baseline justify-between gap-2">
                    <span className="text-[11px] text-ink-dim">{poi.name}</span>
                    <span className="font-mono text-[10px] text-ink">
                      {poi.distanceKm.toFixed(2)} km
                      <span className="ml-1 text-[9px] text-ink-faint">{poi.accuracy}</span>
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-1.5 font-mono text-[9px] text-ink-faint">
                Great-circle distances computed from verified POI coordinates.
              </p>

              <button
                type="button"
                onClick={() => onPlanRoute(cluster)}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-line bg-white/[0.03] px-3 py-1.5 text-xs text-ink transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70"
              >
                <MapPinned className="size-3.5 text-cyan" aria-hidden="true" />
                Plan route near this cluster
              </button>
            </section>
          </>
        ) : null}

        {/* Clicked-point inspection */}
        {!cluster && point ? (
          <section className="rounded-xl border border-line bg-white/[0.02] p-3">
            <h3 className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-cyan/90">
              Point inspection
            </h3>
            <div className="space-y-1">
              <CoordinateRow label="Decimal" value={formatLatLon(point, { decimals: 5 })} />
              <CoordinateRow label="DMS" value={formatLatLon(point, { dms: true })} />
            </div>
            {pointSample ? (
              <div className="mt-3 grid grid-cols-3 gap-1.5 border-t border-line/70 pt-2.5">
                <StatCell label="Elevation" value={pointSample.elevation} unit="m" />
                <StatCell label="Slope" value={pointSample.slope} unit="°" />
                <StatCell label="Roughness" value={pointSample.roughness} unit="m" />
                <StatCell label="Relief" value={pointSample.relief} unit="m" />
                <StatCell label="TRI" value={pointSample.tri} unit="m" />
                <StatCell
                  label="Aspect"
                  value={pointSample.aspect >= 0 ? pointSample.aspect : Number.NaN}
                  unit="°"
                />
              </div>
            ) : null}
            {pointSample && !pointSample.valid ? (
              <p className="mt-2.5 text-[10px] text-amber">
                No valid DEM coverage at this point. Treated as unknown, not safe.
              </p>
            ) : null}
          </section>
        ) : null}

        {!cluster && !point ? (
          <p className="text-[11px] text-ink-dim">Nothing selected.</p>
        ) : null}
      </div>
    </div>
  )
}
