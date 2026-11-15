import {
  Eye,
  EyeOff,
  Layers,
  Map as MapIcon,
  Mountain,
  Ruler,
  Satellite,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import {
  VERIFIED_GLOBAL_LAYERS,
  VERIFIED_REGIONAL_LAYERS,
} from '@/services/nasa/marsTrekProvider'
import type { TrekLayer } from '@/services/nasa/types'
import type { ExplorerTool } from '../ExplorerPage'

interface LayerPanelProps {
  baseLayerId: string
  onBaseLayerChange: (id: string) => void
  overlayLayerId: string | null
  onOverlayLayerChange: (id: string | null) => void
  overlayOpacity: number
  onOverlayOpacityChange: (value: number) => void
  showGrid: boolean
  onShowGridChange: (value: boolean) => void
  showCoverageBoundary: boolean
  onShowCoverageBoundaryChange: (value: boolean) => void
  showRoverTrack: boolean
  onShowRoverTrackChange: (value: boolean) => void
  activeTool: ExplorerTool
  onActiveToolChange: (tool: ExplorerTool) => void
  isOpen: boolean
  onClose: () => void
}

function LayerCard({
  layer,
  active,
  onClick,
  badge,
}: {
  layer: TrekLayer
  active: boolean
  onClick: () => void
  badge?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full rounded-lg border p-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70',
        active
          ? 'border-cyan/40 bg-cyan/10'
          : 'border-line bg-white/[0.02] hover:border-line-strong hover:bg-white/[0.045]',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={cn('block text-xs font-medium', active ? 'text-cyan' : 'text-ink')}>
          {layer.title}
        </span>
        {badge ? (
          <span className="shrink-0 rounded border border-line bg-white/[0.04] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-ink-faint">
            {badge}
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-[10px] leading-relaxed text-ink-dim">
        {layer.mission} · {layer.instrument}
      </p>
      <p className="mt-0.5 font-mono text-[9px] text-ink-faint">
        {layer.resolutionMetersPerPixel < 1
          ? `${(layer.resolutionMetersPerPixel * 100).toFixed(0)} cm/px`
          : `${layer.resolutionMetersPerPixel} m/px`}{' '}
        · {layer.scope}
      </p>
    </button>
  )
}

function ToggleRow({
  label,
  icon: Icon,
  checked,
  onChange,
}: {
  label: string
  icon: React.ElementType
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-lg border border-line bg-white/[0.02] p-2.5 transition-colors hover:bg-white/[0.045]">
      <span className="flex items-center gap-2 text-xs text-ink">
        <Icon className="size-3.5 text-cyan/80" aria-hidden="true" />
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70',
          checked ? 'bg-cyan/80' : 'bg-surface-2',
        )}
      >
        <span
          className={cn(
            'inline-block size-3.5 rounded-full bg-ink transition-transform',
            checked ? 'translate-x-4.5' : 'translate-x-1',
          )}
        />
      </button>
    </label>
  )
}

function ToolButton({
  tool,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  tool: ExplorerTool
  label: string
  icon: React.ElementType
  active: boolean
  onClick: (tool: ExplorerTool) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(tool)}
      className={cn(
        'flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70',
        active
          ? 'border-cyan/40 bg-cyan/10 text-cyan'
          : 'border-line bg-white/[0.02] text-ink-dim hover:border-line-strong hover:text-ink',
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </button>
  )
}

export function LayerPanel({
  baseLayerId,
  onBaseLayerChange,
  overlayLayerId,
  onOverlayLayerChange,
  overlayOpacity,
  onOverlayOpacityChange,
  showGrid,
  onShowGridChange,
  showCoverageBoundary,
  onShowCoverageBoundaryChange,
  showRoverTrack,
  onShowRoverTrackChange,
  activeTool,
  onActiveToolChange,
  isOpen,
  onClose,
}: LayerPanelProps) {
  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen ? (
        <div
          className="absolute inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      ) : null}

      <aside
        className={cn(
          'absolute left-0 top-0 z-40 flex h-full w-80 flex-col border-r border-line bg-space/95 shadow-panel backdrop-blur-md transition-transform lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-cyan" aria-hidden="true" />
            <h2 className="font-display text-sm font-semibold tracking-wide text-ink">Layers & Tools</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-ink-dim hover:bg-white/[0.05] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70 lg:hidden"
            aria-label="Close layer panel"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          {/* Tools */}
          <section>
            <h3 className="eyebrow mb-2 text-[10px]">Tools</h3>
            <div className="grid grid-cols-2 gap-2">
              <ToolButton
                tool="navigate"
                label="Navigate"
                icon={MapIcon}
                active={activeTool === 'navigate'}
                onClick={onActiveToolChange}
              />
              <ToolButton
                tool="inspect"
                label="Inspect"
                icon={Search}
                active={activeTool === 'inspect'}
                onClick={onActiveToolChange}
              />
              <ToolButton
                tool="measure"
                label="Measure"
                icon={Ruler}
                active={activeTool === 'measure'}
                onClick={onActiveToolChange}
              />
              <ToolButton
                tool="profile"
                label="Profile"
                icon={Mountain}
                active={activeTool === 'profile'}
                onClick={onActiveToolChange}
              />
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-ink-faint">
              {activeTool === 'navigate' && 'Drag to pan, scroll or pinch to zoom.'}
              {activeTool === 'inspect' && 'Click anywhere to open the point inspector.'}
              {activeTool === 'measure' && 'Click two points to measure surface distance.'}
              {activeTool === 'profile' && 'Click two points to draw an elevation profile.'}
            </p>
          </section>

          {/* Base map */}
          <section>
            <h3 className="eyebrow mb-2 text-[10px]">Base map</h3>
            <div className="space-y-2">
              {VERIFIED_GLOBAL_LAYERS.map((layer) => (
                <LayerCard
                  key={layer.id}
                  layer={layer}
                  active={baseLayerId === layer.id}
                  onClick={() => onBaseLayerChange(layer.id)}
                  badge={layer.id === baseLayerId ? 'Active' : undefined}
                />
              ))}
            </div>
          </section>

          {/* Regional overlay */}
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="eyebrow text-[10px]">Regional imagery</h3>
              <button
                type="button"
                onClick={() => onOverlayLayerChange(overlayLayerId ? null : VERIFIED_REGIONAL_LAYERS[0].id)}
                className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-cyan hover:text-cyan/80"
              >
                {overlayLayerId ? (
                  <>
                    <EyeOff className="size-3" /> Hide
                  </>
                ) : (
                  <>
                    <Eye className="size-3" /> Show
                  </>
                )}
              </button>
            </div>
            {overlayLayerId ? (
              <>
                <div className="space-y-2">
                  {VERIFIED_REGIONAL_LAYERS.map((layer) => (
                    <LayerCard
                      key={layer.id}
                      layer={layer}
                      active={overlayLayerId === layer.id}
                      onClick={() => onOverlayLayerChange(layer.id)}
                    />
                  ))}
                </div>
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[10px] text-ink-dim">
                      <SlidersHorizontal className="size-3" /> Overlay opacity
                    </span>
                    <span className="font-mono text-[9px] text-ink-faint">
                      {Math.round(overlayOpacity * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={overlayOpacity}
                    onChange={(e) => onOverlayOpacityChange(Number.parseFloat(e.target.value))}
                    className="h-1 w-full cursor-pointer appearance-none rounded bg-surface-2 accent-cyan"
                    aria-label="Overlay opacity"
                  />
                </div>
              </>
            ) : (
              <p className="rounded-lg border border-line bg-white/[0.02] p-3 text-[10px] leading-relaxed text-ink-dim">
                No regional overlay active. Turn on HiRISE or CTX to see high-resolution Jezero
                imagery over the base map.
              </p>
            )}
          </section>

          {/* Terrain & context */}
          <section>
            <h3 className="eyebrow mb-2 text-[10px]">Scientific context</h3>
            <div className="space-y-2">
              <ToggleRow
                label="Coordinate grid"
                icon={Satellite}
                checked={showGrid}
                onChange={onShowGridChange}
              />
              <ToggleRow
                label="Coverage boundary"
                icon={MapIcon}
                checked={showCoverageBoundary}
                onChange={onShowCoverageBoundaryChange}
              />
              <ToggleRow
                label="Perseverance traverse"
                icon={Satellite}
                checked={showRoverTrack}
                onChange={onShowRoverTrackChange}
              />
            </div>
          </section>

          <p className="text-[10px] leading-relaxed text-ink-faint">
            All datasets are verified NASA Mars Trek WMTS products or the committed USGS CTX 20 m
            DEM. Unavailable layers are not listed.
          </p>
        </div>
      </aside>
    </>
  )
}
