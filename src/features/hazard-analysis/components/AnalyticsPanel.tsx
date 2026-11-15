import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { HazardDetectionResult } from '@/engines/hazards/hazardDetection'
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  SEVERITY_COLORS,
  SEVERITY_LABELS,
  type HazardCategory,
  type Severity,
} from '@/engines/hazards/riskModel'
import { cn } from '@/utils/cn'

interface AnalyticsPanelProps {
  detection: HazardDetectionResult
  /** Severity currently highlighted on the map (from a chart click), or null. */
  highlightSeverity: Severity | null
  highlightCategory: HazardCategory | null
  onHighlightSeverity: (severity: Severity | null) => void
  onHighlightCategory: (category: HazardCategory | null) => void
}

interface HistogramBin {
  label: string
  count: number
  color: string
}

const SEVERITY_ROWS: Severity[] = ['critical', 'high', 'moderate', 'low', 'unknown']
const CATEGORY_ROWS: HazardCategory[] = [
  'very_steep',
  'steep_slope',
  'high_roughness',
  'high_relief',
]

const CHART_TOOLTIP_STYLE = {
  backgroundColor: '#111722',
  border: '1px solid #232c3f',
  borderRadius: '8px',
  fontSize: '11px',
} as const

function ChartCaption({ title, hint }: { title: string; hint: string }) {
  return (
    <div>
      <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-ink">
        {title}
      </h3>
      <p className="font-mono text-[9px] text-ink-faint">{hint}</p>
    </div>
  )
}

/**
 * Analytics: cluster-level distributions of the measured DEM statistics. Bars are clickable —
 * selecting a severity or dominant factor highlights the matching clusters on the map (and the
 * selection can be cleared). No decorative charts: every series is a real computed histogram.
 */
export function AnalyticsPanel({
  detection,
  highlightSeverity,
  highlightCategory,
  onHighlightSeverity,
  onHighlightCategory,
}: AnalyticsPanelProps) {
  const [hoveredSeverity, setHoveredSeverity] = useState<Severity | null>(null)

  const clusters = detection.clusters

  // Severity × area (km²) — real per-cluster area summed by class.
  const severityAreaData = useMemo(
    () =>
      SEVERITY_ROWS.map((s) => {
        const list = clusters.filter((c) => c.severity === s)
        return {
          name: SEVERITY_LABELS[s],
          severity: s,
          clusters: list.length,
          areaKm2: Number(list.reduce((sum, c) => sum + c.areaSqM, 0) / 1_000_000),
          color: SEVERITY_COLORS[s],
        }
      }),
    [clusters],
  )

  // Max-slope histogram across clusters (5° bins from the real cluster maxima).
  const slopeHistogram = useMemo<HistogramBin[]>(() => {
    const bins = [0, 1, 2, 3, 4, 5, 6].map((i) => ({
      label: `${i * 5}–${i * 5 + 5}`,
      count: 0,
      color: '#e56b3f',
    }))
    for (const c of clusters) {
      const idx = Math.min(6, Math.floor(c.stats.maxSlopeDeg / 5))
      if (idx >= 0) bins[idx].count++
    }
    return bins
  }, [clusters])

  // Max-roughness histogram (2 m bins).
  const roughnessHistogram = useMemo<HistogramBin[]>(() => {
    const bins = Array.from({ length: 6 }, (_, i) => ({
      label: `${i * 2}–${i * 2 + 2}`,
      count: 0,
      color: '#a78bfa',
    }))
    for (const c of clusters) {
      const idx = Math.min(5, Math.floor(c.stats.maxRoughnessM / 2))
      if (idx >= 0) bins[idx].count++
    }
    return bins
  }, [clusters])

  // Relief histogram (25 m bins).
  const reliefHistogram = useMemo<HistogramBin[]>(() => {
    const bins = Array.from({ length: 6 }, (_, i) => ({
      label: `${i * 25}–${i * 25 + 25}`,
      count: 0,
      color: '#53d6e8',
    }))
    for (const c of clusters) {
      const idx = Math.min(5, Math.floor(c.stats.maxReliefM / 25))
      if (idx >= 0) bins[idx].count++
    }
    return bins
  }, [clusters])

  const categoryData = useMemo(
    () =>
      CATEGORY_ROWS.map((c) => {
        const list = clusters.filter((cluster) => cluster.category === c)
        return {
          name: CATEGORY_LABELS[c],
          category: c,
          clusters: list.length,
          color: CATEGORY_COLORS[c],
        }
      }),
    [clusters],
  )

  const anyHighlight = highlightSeverity !== null || highlightCategory !== null

  return (
    <div className="space-y-5 overflow-y-auto p-3">
      {anyHighlight ? (
        <div className="flex items-center justify-between rounded-lg border border-cyan/30 bg-cyan/[0.06] px-2.5 py-1.5">
          <span className="font-mono text-[10px] text-cyan">
            Highlighting{' '}
            {highlightSeverity
              ? `${SEVERITY_LABELS[highlightSeverity].toLowerCase()} clusters`
              : `${CATEGORY_LABELS[highlightCategory!].toLowerCase()} clusters`}{' '}
            on the map
          </span>
          <button
            type="button"
            onClick={() => {
              onHighlightSeverity(null)
              onHighlightCategory(null)
            }}
            className="rounded px-1.5 py-0.5 text-[10px] text-ink-dim hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70"
          >
            Clear
          </button>
        </div>
      ) : null}

      <section>
        <ChartCaption
          title="Clusters by severity"
          hint="Count of detected clusters per class · click to highlight"
        />
        <div className="mt-1.5 h-36 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={severityAreaData} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#232c3f" />
              <XAxis
                dataKey="name"
                tick={{ fill: '#6b7a94', fontSize: 9 }}
                stroke="#232c3f"
                interval={0}
              />
              <YAxis tick={{ fill: '#6b7a94', fontSize: 9 }} stroke="#232c3f" allowDecimals={false} />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                itemStyle={{ color: '#f5f7fa' }}
                labelStyle={{ color: '#9aa7bd' }}
                cursor={{ fill: 'rgba(83,214,232,0.08)' }}
              />
              <Bar dataKey="clusters" name="Clusters" radius={[3, 3, 0, 0]}>
                {severityAreaData.map((entry) => (
                  <Cell
                    key={entry.severity}
                    fill={entry.color}
                    fillOpacity={
                      highlightSeverity == null || highlightSeverity === entry.severity ? 0.9 : 0.25
                    }
                    className="cursor-pointer"
                    onClick={() =>
                      onHighlightSeverity(
                        highlightSeverity === entry.severity ? null : entry.severity,
                      )
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-1 grid grid-cols-5 gap-1">
          {severityAreaData.map((d) => (
            <button
              key={d.severity}
              type="button"
              onClick={() =>
                onHighlightSeverity(highlightSeverity === d.severity ? null : d.severity)
              }
              onMouseEnter={() => setHoveredSeverity(d.severity)}
              onMouseLeave={() => setHoveredSeverity(null)}
              className={cn(
                'rounded border px-1 py-0.5 text-center font-mono text-[9px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70',
                highlightSeverity === d.severity || hoveredSeverity === d.severity
                  ? 'border-line-strong bg-white/[0.05] text-ink'
                  : 'border-line bg-white/[0.02] text-ink-dim hover:text-ink',
              )}
            >
              <span className="block" style={{ color: d.color }}>
                {d.clusters}
              </span>
              <span className="block text-ink-faint">{d.areaKm2.toFixed(1)} km²</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <ChartCaption
          title="Dominant factor breakdown"
          hint="Cluster count by dominant hazard factor · click to highlight"
        />
        <div className="mt-1.5 h-36 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData} margin={{ top: 8, right: 8, bottom: 14, left: -24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#232c3f" />
              <XAxis
                dataKey="name"
                tick={{ fill: '#6b7a94', fontSize: 8 }}
                stroke="#232c3f"
                interval={0}
                angle={-18}
                textAnchor="end"
                height={36}
              />
              <YAxis tick={{ fill: '#6b7a94', fontSize: 9 }} stroke="#232c3f" allowDecimals={false} />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                itemStyle={{ color: '#f5f7fa' }}
                labelStyle={{ color: '#9aa7bd' }}
                cursor={{ fill: 'rgba(83,214,232,0.08)' }}
              />
              <Bar dataKey="clusters" name="Clusters" radius={[3, 3, 0, 0]}>
                {categoryData.map((entry) => (
                  <Cell
                    key={entry.category}
                    fill={entry.color}
                    fillOpacity={
                      highlightCategory == null || highlightCategory === entry.category
                        ? 0.9
                        : 0.25
                    }
                    className="cursor-pointer"
                    onClick={() =>
                      onHighlightCategory(
                        highlightCategory === entry.category ? null : entry.category,
                      )
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <ChartCaption
          title="Max slope distribution"
          hint="Clusters by maximum slope, 5° bins (DEM-measured)"
        />
        <div className="mt-1.5 h-32 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={slopeHistogram} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#232c3f" />
              <XAxis dataKey="label" tick={{ fill: '#6b7a94', fontSize: 8 }} stroke="#232c3f" />
              <YAxis tick={{ fill: '#6b7a94', fontSize: 9 }} stroke="#232c3f" allowDecimals={false} />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                itemStyle={{ color: '#f5f7fa' }}
                labelStyle={{ color: '#9aa7bd' }}
                cursor={{ fill: 'rgba(83,214,232,0.08)' }}
              />
              <Bar dataKey="count" name="Clusters" radius={[3, 3, 0, 0]}>
                {slopeHistogram.map((b, i) => (
                  <Cell key={i} fill={b.color} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <ChartCaption
          title="Roughness distribution"
          hint="Clusters by maximum roughness (σz), 2 m bins"
        />
        <div className="mt-1.5 h-32 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={roughnessHistogram} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#232c3f" />
              <XAxis dataKey="label" tick={{ fill: '#6b7a94', fontSize: 8 }} stroke="#232c3f" />
              <YAxis tick={{ fill: '#6b7a94', fontSize: 9 }} stroke="#232c3f" allowDecimals={false} />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                itemStyle={{ color: '#f5f7fa' }}
                labelStyle={{ color: '#9aa7bd' }}
                cursor={{ fill: 'rgba(83,214,232,0.08)' }}
              />
              <Bar dataKey="count" name="Clusters" radius={[3, 3, 0, 0]}>
                {roughnessHistogram.map((b, i) => (
                  <Cell key={i} fill={b.color} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <ChartCaption
          title="Local relief distribution"
          hint="Clusters by maximum relief (max − min), 25 m bins"
        />
        <div className="mt-1.5 h-32 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={reliefHistogram} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#232c3f" />
              <XAxis dataKey="label" tick={{ fill: '#6b7a94', fontSize: 8 }} stroke="#232c3f" />
              <YAxis tick={{ fill: '#6b7a94', fontSize: 9 }} stroke="#232c3f" allowDecimals={false} />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                itemStyle={{ color: '#f5f7fa' }}
                labelStyle={{ color: '#9aa7bd' }}
                cursor={{ fill: 'rgba(83,214,232,0.08)' }}
              />
              <Bar dataKey="count" name="Clusters" radius={[3, 3, 0, 0]}>
                {reliefHistogram.map((b, i) => (
                  <Cell key={i} fill={b.color} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  )
}
