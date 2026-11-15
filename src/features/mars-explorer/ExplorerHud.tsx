import { Box, Map as MapIcon, Mountain, Satellite } from 'lucide-react'
import type { TrekLayer } from '@/services/nasa/types'
import { formatLatLon } from '@/utils/geo'
import {
  SLOPE_CLASS_COLORS,
  slopeClass,
  type SlopeClassKey,
} from '@/engines/terrain/slopeClass'
import type { TerrainSample } from './elevationSampler'

export interface ExplorerHudProps {
  layers: TrekLayer[]
  activeLayerId: string
  onLayerChange: (id: string) => void
  viewMode: '2d' | '3d'
  onViewModeChange: (mode: '2d' | '3d') => void
  cursor: { lat: number; lon: number } | null
  terrain: TerrainSample | null
  verticalScale: number
  onVerticalScaleChange: (value: number) => void
}

export function ExplorerHud({
  layers,
  activeLayerId,
  onLayerChange,
  viewMode,
  onViewModeChange,
  cursor,
  terrain,
  verticalScale,
  onVerticalScaleChange,
}: ExplorerHudProps) {
  const activeLayer = layers.find((l) => l.id === activeLayerId) ?? layers[0]

  return (
    <>
      {/* Top-left: layer picker */}
      <div className="pointer-events-auto absolute left-3 top-3 z-30 flex max-w-[70%] flex-col gap-1.5 rounded-lg border border-line bg-space/85 p-2 backdrop-blur-md">
        <span className="eyebrow px-1 text-[9px]">Imagery layer</span>
        <div className="flex flex-wrap gap-1" role="group" aria-label="Imagery layer">
          {layers.map((layer) => (
            <button
              key={layer.id}
              type="button"
              aria-pressed={layer.id === activeLayerId}
              onClick={() => onLayerChange(layer.id)}
              className={`rounded px-2 py-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70 ${
                layer.id === activeLayerId
                  ? 'bg-cyan/15 text-cyan'
                  : 'text-ink-dim hover:bg-white/[0.05] hover:text-ink'
              }`}
            >
              <span className="block font-mono text-[10px] font-semibold uppercase tracking-wider">
                {layer.title.split('—')[1]?.trim() ?? layer.title}
              </span>
              <span className="block font-mono text-[9px] text-ink-faint">
                {layer.resolutionMetersPerPixel} m/px · {layer.scope}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Top-right: view mode + vertical scale */}
      <div className="pointer-events-auto absolute right-3 top-3 z-30 flex flex-col items-end gap-1.5 rounded-lg border border-line bg-space/85 p-2 backdrop-blur-md">
        <span className="eyebrow px-1 text-[9px]">View</span>
        <div className="flex gap-1" role="group" aria-label="View mode">
          <HudToggleButton
            active={viewMode === '2d'}
            onClick={() => onViewModeChange('2d')}
            label="2D map"
          >
            <MapIcon className="size-3.5" />
            2D
          </HudToggleButton>
          <HudToggleButton
            active={viewMode === '3d'}
            onClick={() => onViewModeChange('3d')}
            label="3D terrain"
          >
            <Box className="size-3.5" />
            3D
          </HudToggleButton>
        </div>
        {viewMode === '3d' ? (
          <div className="flex items-center gap-2 pt-1">
            <Mountain className="size-3 text-ink-faint" aria-hidden="true" />
            <input
              type="range"
              min={1}
              max={6}
              step={0.5}
              value={verticalScale}
              onChange={(e) => onVerticalScaleChange(Number.parseFloat(e.target.value))}
              aria-label="Vertical exaggeration"
              className="h-1 w-24 cursor-pointer appearance-none rounded bg-surface-2 accent-cyan"
            />
            <span className="font-mono text-[9px] text-ink-dim">{verticalScale.toFixed(1)}×</span>
          </div>
        ) : null}
      </div>

      {/* Bottom-left: cursor readout */}
      <div className="pointer-events-none absolute bottom-3 left-3 z-30 flex flex-col gap-1.5">
        <div className="flex flex-col gap-1 rounded-lg border border-line bg-space/85 px-2.5 py-2 backdrop-blur-md">
          <span className="font-mono text-[10px] text-cyan/90">
            {cursor ? formatLatLon(cursor, { decimals: 4 }) : 'Cursor — hover the map'}
          </span>
          {terrain ? (
            <>
              <span className="font-mono text-[10px] text-ink">
                Elev {terrain.elevationMeters.toFixed(1)} m{' '}
                <span className="text-[9px] text-ink-faint">({terrain.elevationKind})</span>
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[10px] text-ink">
                Slope {terrain.slopeDegrees.toFixed(1)}°{' '}
                <span
                  aria-hidden="true"
                  className="inline-block size-2 rounded-full"
                  style={{ backgroundColor: SLOPE_CLASS_COLORS[slopeClass(terrain.slopeDegrees).key] }}
                />
                <span className="text-[9px] text-ink-faint">
                  {slopeClass(terrain.slopeDegrees).label} ({terrain.slopeKind})
                </span>
              </span>
            </>
          ) : cursor ? (
            <span className="font-mono text-[10px] text-ink-faint">No DEM coverage at cursor</span>
          ) : null}
        </div>
      </div>

      {/* Bottom-right: attribution */}
      <div className="pointer-events-auto absolute bottom-3 right-3 z-30 max-w-[280px] rounded-lg border border-line bg-space/85 px-2.5 py-2 text-right backdrop-blur-md">
        <p className="font-mono text-[10px] uppercase tracking-wider text-cyan/90">
          {activeLayer.title}
        </p>
        <p className="mt-0.5 font-mono text-[9px] leading-relaxed text-ink-faint">
          {activeLayer.attribution} · {activeLayer.mission}
        </p>
        <p className="mt-0.5 flex items-center justify-end gap-1 font-mono text-[9px] text-ink-faint">
          <Satellite className="size-3" aria-hidden="true" />
          Live WMTS tiles · Trek verified
        </p>
        {activeLayer.scope === 'regional' ? (
          <p className="mt-0.5 font-mono text-[9px] text-amber">
            Regional · zoom {activeLayer.minZoom}-{activeLayer.maxZoom}
          </p>
        ) : null}
      </div>

      {/* Legend */}
      <div className="pointer-events-none absolute bottom-3 left-1/2 z-30 -translate-x-1/2">
        <div className="flex gap-3 rounded-lg border border-line bg-space/85 px-2.5 py-1.5 backdrop-blur-md">
          {(
            [
              { key: 'flat', label: '< 5°' },
              { key: 'moderate', label: '5–15°' },
              { key: 'steep', label: '15–25°' },
              { key: 'hazardous', label: '> 25°' },
            ] as Array<{ key: SlopeClassKey; label: string }>
          ).map((item) => (
            <span key={item.key} className="flex items-center gap-1 font-mono text-[9px] text-ink-dim">
              <span
                aria-hidden="true"
                className="inline-block size-2 rounded-full"
                style={{ backgroundColor: SLOPE_CLASS_COLORS[item.key] }}
              />
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </>
  )
}

function HudToggleButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      title={label}
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded border px-2 py-1 font-mono text-[9px] uppercase tracking-wider backdrop-blur-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70 ${
        active
          ? 'border-cyan/40 bg-cyan/10 text-cyan'
          : 'border-line bg-space/85 text-ink-faint hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}
