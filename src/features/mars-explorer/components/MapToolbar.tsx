import { Box, Layers, Map as MapIcon, MapPinned, RotateCcw } from 'lucide-react'
import { cn } from '@/utils/cn'

interface QuickLocation {
  name: string
  lat: number
  lon: number
  zoom: number
}

interface MapToolbarProps {
  viewMode: '2d' | '3d'
  onViewModeChange: (mode: '2d' | '3d') => void
  onResetView: () => void
  onToggleLayerPanel: () => void
  quickLocations: QuickLocation[]
  onQuickLocation: (loc: QuickLocation) => void
}

export function MapToolbar({
  viewMode,
  onViewModeChange,
  onResetView,
  onToggleLayerPanel,
  quickLocations,
  onQuickLocation,
}: MapToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line bg-space/95 px-4 py-2 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleLayerPanel}
          className="flex items-center gap-1.5 rounded-lg border border-line bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70"
        >
          <Layers className="size-3.5 text-cyan" aria-hidden="true" />
          Layers
        </button>

        <div className="hidden items-center gap-1 rounded-lg border border-line bg-white/[0.02] p-0.5 sm:flex">
          <ViewModeButton
            active={viewMode === '2d'}
            onClick={() => onViewModeChange('2d')}
            icon={MapIcon}
            label="2D map"
          />
          <ViewModeButton
            active={viewMode === '3d'}
            onClick={() => onViewModeChange('3d')}
            icon={Box}
            label="3D terrain"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <select
            onChange={(e) => {
              const idx = Number.parseInt(e.target.value, 10)
              if (Number.isFinite(idx) && quickLocations[idx]) {
                onQuickLocation(quickLocations[idx])
              }
            }}
            className="appearance-none rounded-lg border border-line bg-white/[0.03] py-1.5 pl-3 pr-8 text-xs text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70"
            aria-label="Jump to location"
            value=""
          >
            <option value="" disabled>
              Jump to…
            </option>
            {quickLocations.map((loc, i) => (
              <option key={loc.name} value={i}>
                {loc.name}
              </option>
            ))}
          </select>
          <MapPinned className="pointer-events-none absolute right-2 top-1/2 size-3 -translate-y-1/2 text-ink-dim" aria-hidden="true" />
        </div>

        <button
          type="button"
          onClick={onResetView}
          className="flex items-center gap-1.5 rounded-lg border border-line bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70"
          title="Reset view"
        >
          <RotateCcw className="size-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>
    </div>
  )
}

function ViewModeButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ElementType
  label: string
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70',
        active
          ? 'bg-cyan/15 text-cyan'
          : 'text-ink-dim hover:bg-white/[0.05] hover:text-ink',
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </button>
  )
}
