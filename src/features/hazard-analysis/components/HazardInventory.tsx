import { useMemo, useState } from 'react'
import { ArrowDownWideNarrow, Search, ShieldAlert } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { HazardCluster, HazardDetectionResult } from '@/engines/hazards/hazardDetection'
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  SEVERITY_COLORS,
  SEVERITY_LABELS,
  type HazardCategory,
  type Severity,
} from '@/engines/hazards/riskModel'

interface HazardInventoryProps {
  detection: HazardDetectionResult
  totalAreaSqKm: number
  selectedId: number | null
  onSelect: (cluster: HazardCluster | null) => void
  onHover: (cluster: HazardCluster | null) => void
}

type SortKey = 'severity' | 'area' | 'slope' | 'roughness' | 'risk'

const SEVERITY_FILTERS: Array<{ id: Severity | 'all'; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'critical', label: SEVERITY_LABELS.critical },
  { id: 'high', label: SEVERITY_LABELS.high },
  { id: 'moderate', label: SEVERITY_LABELS.moderate },
]

const CATEGORY_FILTERS: Array<{ id: HazardCategory | 'all'; label: string }> = [
  { id: 'all', label: 'All factors' },
  { id: 'very_steep', label: CATEGORY_LABELS.very_steep },
  { id: 'steep_slope', label: CATEGORY_LABELS.steep_slope },
  { id: 'high_roughness', label: CATEGORY_LABELS.high_roughness },
  { id: 'high_relief', label: CATEGORY_LABELS.high_relief },
]

const SORT_OPTIONS: Array<{ id: SortKey; label: string }> = [
  { id: 'severity', label: 'Severity' },
  { id: 'area', label: 'Largest area' },
  { id: 'slope', label: 'Max slope' },
  { id: 'roughness', label: 'Max roughness' },
  { id: 'risk', label: 'Combined risk' },
]

function MiniMetric({
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
      className="flex-1 rounded-lg border border-line bg-white/[0.02] px-2 py-1.5"
      title={title}
    >
      <p className="font-mono text-[8px] uppercase tracking-wider text-ink-faint">{label}</p>
      <p
        className="font-mono text-[13px] font-medium leading-tight"
        style={color ? { color } : undefined}
      >
        {value}
      </p>
    </div>
  )
}

function ClusterCard({
  cluster,
  selected,
  onSelect,
  onHover,
}: {
  cluster: HazardCluster
  selected: boolean
  onSelect: () => void
  onHover: (hovering: boolean) => void
}) {
  const severityColor = SEVERITY_COLORS[cluster.severity]
  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onFocus={() => onHover(true)}
      onBlur={() => onHover(false)}
      aria-pressed={selected}
      className={cn(
        'group relative w-full overflow-hidden rounded-lg border text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70',
        selected
          ? 'border-cyan/60 bg-cyan/[0.08]'
          : 'border-line bg-white/[0.02] hover:border-line-strong hover:bg-white/[0.045]',
      )}
    >
      {/* Severity accent bar */}
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ backgroundColor: severityColor, opacity: selected ? 1 : 0.7 }}
      />
      <div className="pl-2.5 pr-2.5 py-2">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 font-mono text-[11px] font-medium text-ink">
            <span
              aria-hidden="true"
              className="inline-block size-2 rounded-full"
              style={{ backgroundColor: severityColor }}
            />
            H{cluster.id}
          </span>
          <span
            className="rounded px-1.5 py-px font-mono text-[9px] uppercase tracking-wider"
            style={{ backgroundColor: `${severityColor}22`, color: severityColor }}
          >
            {SEVERITY_LABELS[cluster.severity]}
          </span>
        </div>

        <div className="mt-1 flex items-center gap-1.5 text-[10px] text-ink-dim">
          <span
            aria-hidden="true"
            className="inline-block size-2 rounded-sm"
            style={{ backgroundColor: CATEGORY_COLORS[cluster.category] }}
          />
          {CATEGORY_LABELS[cluster.category]}
        </div>

        <div className="mt-1.5 flex items-center gap-3 font-mono text-[9px] text-ink-faint">
          <span>{(cluster.areaSqM / 1_000_000).toFixed(2)} km²</span>
          <span>max {cluster.stats.maxSlopeDeg.toFixed(0)}°</span>
          <span>rough {cluster.stats.maxRoughnessM.toFixed(0)} m</span>
        </div>
      </div>
    </button>
  )
}

/**
 * Hazard inventory: live summary metrics, functional filtering/sorting, and compact cluster
 * cards. Hovering a card previews the cluster outline on the map; clicking selects + centers it.
 */
export function HazardInventory({
  detection,
  totalAreaSqKm,
  selectedId,
  onSelect,
  onHover,
}: HazardInventoryProps) {
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<HazardCategory | 'all'>('all')
  const [minAreaKm2, setMinAreaKm2] = useState(0)
  const [maxSlopeFilter, setMaxSlopeFilter] = useState(0)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('severity')

  const filtered = useMemo(() => {
    const query = search.trim()
    let list = detection.clusters.filter((c) => {
      if (severityFilter !== 'all' && c.severity !== severityFilter) return false
      if (categoryFilter !== 'all' && c.category !== categoryFilter) return false
      if (c.areaSqM < minAreaKm2 * 1_000_000) return false
      if (maxSlopeFilter > 0 && c.stats.maxSlopeDeg < maxSlopeFilter) return false
      if (query && !(query === `${c.id}` || query === `H${c.id}` || query.toLowerCase() === c.category.replace(/_/g, ' ')))
        return false
      return true
    })

    const severityRank: Record<Severity, number> = {
      critical: 4,
      high: 3,
      moderate: 2,
      low: 1,
      unknown: 0,
    }
    list = [...list].sort((a, b) => {
      switch (sortKey) {
        case 'area':
          return b.areaSqM - a.areaSqM
        case 'slope':
          return b.stats.maxSlopeDeg - a.stats.maxSlopeDeg
        case 'roughness':
          return b.stats.maxRoughnessM - a.stats.maxRoughnessM
        case 'risk':
          return b.maxScore - a.maxScore
        case 'severity':
        default: {
          const rankDiff = severityRank[b.severity] - severityRank[a.severity]
          if (rankDiff !== 0) return rankDiff
          return b.areaSqM - a.areaSqM
        }
      }
    })
    return list
  }, [detection.clusters, severityFilter, categoryFilter, minAreaKm2, maxSlopeFilter, search, sortKey])

  const affectedAreaSqKm = useMemo(
    () => detection.clusters.reduce((sum, c) => sum + c.areaSqM, 0) / 1_000_000,
    [detection.clusters],
  )
  const largest = useMemo(
    () =>
      detection.clusters.reduce<HazardCluster | null>(
        (max, c) => (max == null || c.areaSqM > max.areaSqM ? c : max),
        null,
      ),
    [detection.clusters],
  )

  return (
    <div className="flex h-full flex-col">
      {/* Summary metrics */}
      <div className="space-y-2 border-b border-line px-3 py-2.5">
        <div className="flex items-center gap-2">
          <ShieldAlert className="size-3.5 text-cyan" aria-hidden="true" />
          <h2 className="font-display text-xs font-semibold uppercase tracking-wider text-ink">
            Hazard inventory
          </h2>
        </div>
        <div className="flex gap-1.5">
          <MiniMetric label="Clusters" value={`${detection.clusters.length}`} />
          <MiniMetric
            label="Critical"
            value={`${detection.severityCounts.critical}`}
            color={SEVERITY_COLORS.critical}
          />
          <MiniMetric
            label="Affected"
            value={`${affectedAreaSqKm.toFixed(1)} km²`}
          />
        </div>
        <div className="flex gap-1.5">
          <MiniMetric
            label="Largest"
            value={largest ? `${(largest.areaSqM / 1_000_000).toFixed(2)} km²` : '—'}
            title={largest ? `H${largest.id}` : undefined}
          />
          <MiniMetric label="DEM coverage" value={`${totalAreaSqKm.toFixed(0)} km²`} />
          <MiniMetric
            label="Moderate+"
            value={`${Math.round(
              ((detection.severityCounts.moderate +
                detection.severityCounts.high +
                detection.severityCounts.critical) /
                Math.max(1, detection.validCellCount)) *
                100,
            )}%`}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-2 border-b border-line px-3 py-2.5">
        <div className="flex flex-wrap gap-1">
          {SEVERITY_FILTERS.map((f) => {
            const active = severityFilter === f.id
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setSeverityFilter(f.id)}
                aria-pressed={active}
                className={cn(
                  'rounded-md border px-2 py-0.5 font-mono text-[10px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70',
                  active
                    ? 'border-cyan/50 bg-cyan/10 text-cyan'
                    : 'border-line bg-white/[0.02] text-ink-dim hover:text-ink',
                )}
              >
                {f.label}
              </button>
            )
          })}
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as HazardCategory | 'all')}
            aria-label="Filter by dominant hazard factor"
            className="w-full rounded-md border border-line bg-space px-1.5 py-1 font-mono text-[10px] text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70"
          >
            {CATEGORY_FILTERS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            aria-label="Sort hazards"
            className="w-full rounded-md border border-line bg-space px-1.5 py-1 font-mono text-[10px] text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.id} value={s.id}>
                Sort: {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <label className="rounded-md border border-line bg-white/[0.02] px-2 py-1">
            <span className="block font-mono text-[8px] uppercase tracking-wider text-ink-faint">
              Min area (km²)
            </span>
            <input
              type="number"
              min={0}
              step={0.1}
              value={minAreaKm2}
              onChange={(e) => setMinAreaKm2(Math.max(0, Number.parseFloat(e.target.value) || 0))}
              aria-label="Minimum cluster area in square kilometers"
              className="w-full bg-transparent font-mono text-[11px] text-ink focus:outline-none"
            />
          </label>
          <label className="rounded-md border border-line bg-white/[0.02] px-2 py-1">
            <span className="block font-mono text-[8px] uppercase tracking-wider text-ink-faint">
              Max slope ≥ (°)
            </span>
            <input
              type="number"
              min={0}
              max={45}
              step={1}
              value={maxSlopeFilter}
              onChange={(e) => setMaxSlopeFilter(Math.max(0, Number.parseFloat(e.target.value) || 0))}
              aria-label="Minimum cluster maximum slope in degrees"
              className="w-full bg-transparent font-mono text-[11px] text-ink focus:outline-none"
            />
          </label>
        </div>

        <div className="relative">
          <Search
            className="pointer-events-none absolute left-2 top-1/2 size-3 -translate-y-1/2 text-ink-faint"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID (e.g. 336)"
            aria-label="Search clusters by identifier"
            className="w-full rounded-md border border-line bg-white/[0.02] py-1 pl-7 pr-2 font-mono text-[11px] text-ink placeholder:text-ink-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70"
          />
        </div>
      </div>

      {/* Result count */}
      <div className="flex items-center justify-between border-b border-line px-3 py-1.5 font-mono text-[10px] text-ink-faint">
        <span className="flex items-center gap-1">
          <ArrowDownWideNarrow className="size-3" aria-hidden="true" />
          {filtered.length === detection.clusters.length
            ? `${filtered.length} clusters`
            : `${filtered.length} of ${detection.clusters.length}`}
        </span>
        {filtered.length !== detection.clusters.length ? (
          <button
            type="button"
            onClick={() => {
              setSeverityFilter('all')
              setCategoryFilter('all')
              setMinAreaKm2(0)
              setMaxSlopeFilter(0)
              setSearch('')
            }}
            className="text-cyan hover:underline focus-visible:outline-none"
          >
            Clear filters
          </button>
        ) : null}
      </div>

      {/* Cluster cards */}
      <div className="flex-1 space-y-1.5 overflow-y-auto p-2" role="list">
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-line bg-white/[0.02] p-4 text-center">
            <Search className="mx-auto size-5 text-ink-faint" aria-hidden="true" />
            <p className="mt-2 text-[11px] text-ink-dim">No clusters match the current filters.</p>
          </div>
        ) : (
          filtered.map((cluster) => (
            <div key={cluster.id} role="listitem">
              <ClusterCard
                cluster={cluster}
                selected={selectedId === cluster.id}
                onSelect={() => onSelect(cluster.id === selectedId ? null : cluster)}
                onHover={(hovering) => onHover(hovering ? cluster : null)}
              />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
