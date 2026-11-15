import { useMemo } from 'react'
import { latLonToPixel } from '@/features/mars-explorer'
import { formatLatLon } from '@/utils/geo'
import { assessCellRisk, SEVERITY_COLORS, SEVERITY_LABELS, type MobilityProfile } from '@/engines/hazards/riskModel'
import type { TerrainAnalysis } from '@/engines/hazards/terrainAnalysis'
import { sampleAnalysis } from '@/engines/hazards/terrainAnalysis'

export interface CursorTooltipProps {
  /** Cursor geographic position (null when off-map). */
  cursor: { lat: number; lon: number } | null
  center: { lat: number; lon: number }
  zoom: number
  size: { width: number; height: number }
  analysis: TerrainAnalysis | null
  profile: MobilityProfile
}

/**
 * Cursor-following terrain readout: geographic position, measured DEM values, and the live
 * per-cell classification under the active profile. Positioned relative to the cursor so it
 * tracks without stealing pointer events.
 */
export function CursorTooltip({ cursor, center, zoom, size, analysis, profile }: CursorTooltipProps) {
  const cursorPixel = useMemo(
    () => (cursor && size.width > 0 ? latLonToPixel(cursor, center, zoom, size) : null),
    [cursor, center, zoom, size],
  )

  const sample = useMemo(
    () => (cursor && analysis ? sampleAnalysis(analysis, cursor) : null),
    [cursor, analysis],
  )

  const classification = useMemo(() => {
    if (!sample || !analysis) return null
    const risk = assessCellRisk(
      sample.slope,
      sample.roughness,
      sample.relief,
      sample.valid,
      profile,
    )
    return risk
  }, [sample, analysis, profile])

  if (!cursorPixel || !cursor) return null

  // Flip near the right/bottom edges so the tooltip stays inside the map.
  const flipX = cursorPixel.x > 260
  const flipY = cursorPixel.y > 180

  return (
    <div
      className="pointer-events-none absolute z-40"
      style={{
        left: cursorPixel.x,
        top: cursorPixel.y,
        transform: `translate(${flipX ? 'calc(-100% - 14px)' : '14px'}, ${
          flipY ? 'calc(-100% - 14px)' : '14px'
        })`,
      }}
      role="status"
      aria-hidden="true"
    >
      <div className="min-w-[190px] rounded-lg border border-line bg-space/95 px-3 py-2 shadow-panel backdrop-blur-md">
        <p className="font-mono text-[10px] text-cyan/90">{formatLatLon(cursor, { decimals: 4 })}</p>
        {sample ? (
          <>
            <div className="mt-1 flex items-center gap-2 font-mono text-[10px] text-ink">
              <span>Elev {sample.elevation.toFixed(0)} m</span>
              <span className="text-ink-faint">·</span>
              <span>Slope {sample.slope.toFixed(1)}°</span>
            </div>
            <div className="font-mono text-[9px] text-ink-faint">
              Rough {sample.roughness.toFixed(1)} m · Relief {sample.relief.toFixed(1)} m
              {sample.aspect >= 0 ? ` · Aspect ${sample.aspect.toFixed(0)}°` : ''}
            </div>
            {classification ? (
              <div className="mt-1.5 flex items-center gap-1.5 border-t border-line/70 pt-1.5">
                <span
                  aria-hidden="true"
                  className="inline-block size-2 rounded-full"
                  style={{ backgroundColor: SEVERITY_COLORS[classification.severity] }}
                />
                <span
                  className="font-mono text-[9px] uppercase tracking-wider"
                  style={{ color: SEVERITY_COLORS[classification.severity] }}
                >
                  {SEVERITY_LABELS[classification.severity]}
                </span>
                <span className="ml-auto font-mono text-[9px] text-ink-faint">
                  score {classification.score.toFixed(2)}
                </span>
              </div>
            ) : null}
          </>
        ) : (
          <p className="mt-1 font-mono text-[9px] text-ink-faint">
            Outside DEM coverage — unknown
          </p>
        )}
      </div>
    </div>
  )
}
