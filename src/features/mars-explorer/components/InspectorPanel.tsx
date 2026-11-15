import { X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { formatLatLon } from '@/utils/geo'
import { SLOPE_CLASS_COLORS, slopeClass } from '@/engines/terrain/slopeClass'
import type { LatLon } from '@/types/geo'

interface TerrainInfo {
  elevationMeters: number
  slopeDegrees: number
  elevationKind: string
  slopeKind: string
}

interface ProfileSample extends TerrainInfo {
  lat: number
  lon: number
  distanceM: number
}

interface InspectorPanelProps {
  inspectedPoint: LatLon | null
  terrain: TerrainInfo | null
  profileSamples?: ProfileSample[]
  isOpen: boolean
  onClose: () => void
}

function CoordinateRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[10px] uppercase tracking-wider text-ink-faint">{label}</span>
      <span className="font-mono text-xs text-cyan/90">{value}</span>
    </div>
  )
}

export function InspectorPanel({
  inspectedPoint,
  terrain,
  profileSamples = [],
  isOpen,
  onClose,
}: InspectorPanelProps) {
  return (
    <>
      {isOpen ? (
        <div
          className="absolute inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      ) : null}

      <aside
        className={cn(
          'absolute right-0 top-0 z-40 flex h-full w-80 flex-col border-l border-line bg-space/95 shadow-panel backdrop-blur-md transition-transform lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="font-display text-sm font-semibold tracking-wide text-ink">Inspector</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-ink-dim hover:bg-white/[0.05] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70"
            aria-label="Close inspector"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          {inspectedPoint ? (
            <section className="rounded-xl border border-line bg-white/[0.02] p-3">
              <h3 className="eyebrow mb-3 text-[10px]">Selected point</h3>
              <div className="space-y-2">
                <CoordinateRow
                  label="Decimal"
                  value={formatLatLon(inspectedPoint, { decimals: 5 })}
                />
                <CoordinateRow
                  label="DMS"
                  value={formatLatLon(inspectedPoint, { dms: true })}
                />
              </div>

              {terrain ? (
                <div className="mt-4 space-y-3 border-t border-line/70 pt-3">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-ink-faint">Elevation</span>
                    <p className="mt-0.5 font-mono text-lg text-ink">
                      {terrain.elevationMeters.toFixed(1)} <span className="text-xs text-ink-dim">m</span>
                    </p>
                    <p className="text-[9px] text-ink-faint">{terrain.elevationKind} · MOLA areoid</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-ink-faint">Slope</span>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="font-mono text-lg text-ink">
                        {terrain.slopeDegrees.toFixed(1)}°
                      </span>
                      <span
                        className="inline-block size-3 rounded-full"
                        style={{
                          backgroundColor: SLOPE_CLASS_COLORS[slopeClass(terrain.slopeDegrees).key],
                        }}
                      />
                    </div>
                    <p className="text-[9px] text-ink-faint">
                      {slopeClass(terrain.slopeDegrees).label} · {terrain.slopeKind}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-[10px] text-amber">
                  No DEM coverage at this point. The committed CTX 20 m DEM covers the Jezero
                  region only.
                </p>
              )}
            </section>
          ) : (
            <p className="rounded-xl border border-line bg-white/[0.02] p-3 text-xs leading-relaxed text-ink-dim">
              Select the Inspect tool and click on the map to see coordinates, elevation, slope and
              terrain classification.
            </p>
          )}

          {profileSamples.length > 0 ? (
            <section className="rounded-xl border border-line bg-white/[0.02] p-3">
              <h3 className="eyebrow mb-3 text-[10px]">Elevation profile</h3>
              <SimpleProfileChart samples={profileSamples} />
              <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <span className="block text-ink-faint">Distance</span>
                  <span className="font-mono text-ink">
                    {(profileSamples[profileSamples.length - 1].distanceM / 1000).toFixed(2)} km
                  </span>
                </div>
                <div>
                  <span className="block text-ink-faint">Elev range</span>
                  <span className="font-mono text-ink">
                    {Math.min(...profileSamples.map((s) => s.elevationMeters)).toFixed(0)} –{' '}
                    {Math.max(...profileSamples.map((s) => s.elevationMeters)).toFixed(0)} m
                  </span>
                </div>
              </div>
            </section>
          ) : null}

          <section className="rounded-xl border border-line bg-white/[0.02] p-3">
            <h3 className="eyebrow mb-2 text-[10px]">Data sources</h3>
            <p className="text-[10px] leading-relaxed text-ink-dim">
              Elevation and slope come from the USGS Mars 2020 TRN CTX DTM Mosaic (20 m/px).
              Imagery comes from NASA Mars Trek WMTS. Coordinates are east-positive.
            </p>
          </section>
        </div>
      </aside>
    </>
  )
}

function SimpleProfileChart({ samples }: { samples: ProfileSample[] }) {
  const minElev = Math.min(...samples.map((s) => s.elevationMeters))
  const maxElev = Math.max(...samples.map((s) => s.elevationMeters))
  const range = Math.max(1, maxElev - minElev)
  const width = 240
  const height = 80
  const padding = 4

  const points = samples.map((s, i) => {
    const x = padding + (i / (samples.length - 1)) * (width - padding * 2)
    const y = height - padding - ((s.elevationMeters - minElev) / range) * (height - padding * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  const pathD = `M ${points.join(' L ')}`

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke="#53d6e8"
        strokeWidth={2}
        points={points.join(' ')}
      />
      <path
        d={`${pathD} L ${width - padding},${height} L ${padding},${height} Z`}
        fill="url(#profileGradient)"
        opacity={0.25}
      />
      <defs>
        <linearGradient id="profileGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#53d6e8" />
          <stop offset="100%" stopColor="#53d6e8" stopOpacity={0} />
        </linearGradient>
      </defs>
      <text x={padding} y={12} fill="#9aa7bd" fontSize={9} fontFamily="JetBrains Mono, monospace">
        {maxElev.toFixed(0)} m
      </text>
      <text
        x={padding}
        y={height - 4}
        fill="#9aa7bd"
        fontSize={9}
        fontFamily="JetBrains Mono, monospace"
      >
        {minElev.toFixed(0)} m
      </text>
    </svg>
  )
}
