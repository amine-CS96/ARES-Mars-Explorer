import { useState } from 'react'
import { ChevronDown, Layers, Mountain, SlidersHorizontal, X } from 'lucide-react'
import { cn } from '@/utils/cn'
import {
  OVERLAY_MODES,
  type HazardOverlayMode,
} from '@/features/hazard-analysis/hazardOverlays'
import { VERIFIED_GLOBAL_LAYERS, getVerifiedLayer } from '@/services/nasa/marsTrekProvider'
import { MissionProfileSelector } from './MissionProfileSelector'
import type { MobilityProfile } from '@/engines/hazards/riskModel'

interface AnalysisPanelProps {
  mode: HazardOverlayMode
  onModeChange: (mode: HazardOverlayMode) => void
  overlayOpacity: number
  onOverlayOpacityChange: (value: number) => void
  showClusters: boolean
  onShowClustersChange: (value: boolean) => void
  showRoute: boolean
  onShowRouteChange: (value: boolean) => void
  showRoverTrack: boolean
  onShowRoverTrackChange: (value: boolean) => void
  baseLayerId: string
  onBaseLayerChange: (id: string) => void
  profile: MobilityProfile
  onProfileChange: (profile: MobilityProfile) => void
  clusterCount: number | null
  isOpen: boolean
  onClose: () => void
}

function SectionHeader({
  icon: Icon,
  label,
  open,
  onToggle,
}: {
  icon: React.ElementType
  label: string
  open: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="flex w-full items-center gap-1.5 py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70 rounded"
    >
      <Icon className="size-3.5 text-cyan/90" aria-hidden="true" />
      <span className="flex-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-dim">
        {label}
      </span>
      <ChevronDown
        className={cn('size-3.5 text-ink-faint transition-transform', open ? '' : '-rotate-90')}
        aria-hidden="true"
      />
    </button>
  )
}

/**
 * Left analysis panel: mobility profile, terrain layer (with per-layer legend + methodology),
 * overlay opacity, and map feature visibility controls. Collapsible sections keep the panel
 * scannable without hiding anything permanently.
 */
export function AnalysisPanel({
  mode,
  onModeChange,
  overlayOpacity,
  onOverlayOpacityChange,
  showClusters,
  onShowClustersChange,
  showRoute,
  onShowRouteChange,
  showRoverTrack,
  onShowRoverTrackChange,
  baseLayerId,
  onBaseLayerChange,
  profile,
  onProfileChange,
  clusterCount,
  isOpen,
  onClose,
}: AnalysisPanelProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    profile: true,
    layers: true,
    features: true,
    base: false,
  })
  const activeMode = OVERLAY_MODES.find((m) => m.id === mode) ?? OVERLAY_MODES[0]
  const terrainLayerActive = mode !== 'clusters' && mode !== 'none'

  const toggle = (key: string) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))

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
          'absolute left-0 top-0 z-40 flex h-full w-[270px] flex-col border-r border-line bg-space/95 shadow-panel backdrop-blur-md transition-transform lg:static lg:z-auto lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Analysis controls"
      >
        <div className="flex items-center justify-between border-b border-line px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-cyan" aria-hidden="true" />
            <h2 className="font-display text-sm font-semibold tracking-wide text-ink">Controls</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-ink-dim hover:bg-white/[0.05] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70 lg:hidden"
            aria-label="Close analysis panel"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-3">
          {/* Mobility profile */}
          <section>
            <SectionHeader
              icon={SlidersHorizontal}
              label="Mobility profile"
              open={openSections.profile}
              onToggle={() => toggle('profile')}
            />
            {openSections.profile ? (
              <div className="mt-1.5">
                <MissionProfileSelector value={profile.id} onChange={onProfileChange} compact />
              </div>
            ) : null}
          </section>

          {/* Terrain layer */}
          <section className="border-t border-line pt-2">
            <SectionHeader
              icon={Layers}
              label="Terrain layer"
              open={openSections.layers}
              onToggle={() => toggle('layers')}
            />
            {openSections.layers ? (
              <div className="mt-1.5 space-y-1.5">
                <div className="grid grid-cols-2 gap-1.5">
                  {OVERLAY_MODES.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => onModeChange(m.id)}
                      aria-pressed={mode === m.id}
                      title={m.description}
                      className={cn(
                        'rounded-md border px-2 py-1.5 text-left text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70',
                        mode === m.id
                          ? 'border-cyan/50 bg-cyan/10 text-cyan'
                          : 'border-line bg-white/[0.02] text-ink-dim hover:bg-white/[0.045] hover:text-ink',
                      )}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                <div className="rounded-lg border border-line bg-white/[0.02] p-2.5">
                  <p className="text-[11px] font-medium text-ink">{activeMode.label}</p>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-ink-dim">
                    {activeMode.description}
                  </p>
                  <p className="mt-1 font-mono text-[9px] text-ink-faint">
                    Unit: {activeMode.unit} · {activeMode.method}
                  </p>
                  <div className="mt-2 space-y-1 border-t border-line/70 pt-2">
                    {activeMode.legend.map((item) => (
                      <span
                        key={item.label}
                        className="flex items-center gap-2 font-mono text-[10px] text-ink-dim"
                      >
                        <span
                          aria-hidden="true"
                          className="inline-block size-2.5 rounded"
                          style={{ backgroundColor: item.color }}
                        />
                        {item.label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Overlay opacity (real control wired to the terrain raster) */}
                <div
                  className={cn(
                    'rounded-lg border border-line bg-white/[0.02] p-2.5',
                    !terrainLayerActive && 'opacity-50',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="overlay-opacity"
                      className="font-mono text-[9px] uppercase tracking-wider text-ink-faint"
                    >
                      Layer opacity
                    </label>
                    <span className="font-mono text-[10px] text-ink">
                      {Math.round(overlayOpacity * 100)}%
                    </span>
                  </div>
                  <input
                    id="overlay-opacity"
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={overlayOpacity}
                    disabled={!terrainLayerActive}
                    onChange={(e) => onOverlayOpacityChange(Number.parseFloat(e.target.value))}
                    className="mt-1.5 h-1 w-full cursor-pointer appearance-none rounded bg-surface-2 accent-cyan"
                  />
                </div>
              </div>
            ) : null}
          </section>

          {/* Map features */}
          <section className="border-t border-line pt-2">
            <SectionHeader
              icon={Mountain}
              label="Map features"
              open={openSections.features}
              onToggle={() => toggle('features')}
            />
            {openSections.features ? (
              <div className="mt-1.5 space-y-1.5">
                <FeatureToggle
                  label="Hazard clusters"
                  detail={clusterCount != null ? `${clusterCount} regions outlined` : undefined}
                  checked={showClusters}
                  onChange={onShowClustersChange}
                />
                <FeatureToggle
                  label="Planner route"
                  detail="Imported route geometry & exposure"
                  checked={showRoute}
                  onChange={onShowRouteChange}
                />
                <FeatureToggle
                  label="Perseverance traverse"
                  detail="MMGIS waypoint snapshot"
                  checked={showRoverTrack}
                  onChange={onShowRoverTrackChange}
                />
              </div>
            ) : null}
          </section>

          {/* Base map */}
          <section className="border-t border-line pt-2">
            <SectionHeader
              icon={Layers}
              label="Base imagery"
              open={openSections.base}
              onToggle={() => toggle('base')}
            />
            {openSections.base ? (
              <div className="mt-1.5 space-y-1">
                {VERIFIED_GLOBAL_LAYERS.map((layer) => {
                  const active = layer.id === baseLayerId
                  const verified = getVerifiedLayer(layer.id)
                  return (
                    <button
                      key={layer.id}
                      type="button"
                      onClick={() => onBaseLayerChange(layer.id)}
                      aria-pressed={active}
                      className={cn(
                        'w-full rounded-md border px-2 py-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70',
                        active
                          ? 'border-cyan/50 bg-cyan/10'
                          : 'border-line bg-white/[0.02] hover:bg-white/[0.045]',
                      )}
                    >
                      <span
                        className={cn(
                          'block text-[11px] leading-tight',
                          active ? 'text-cyan' : 'text-ink-dim',
                        )}
                      >
                        {layer.title}
                      </span>
                      <span className="mt-0.5 block font-mono text-[9px] text-ink-faint">
                        {verified
                          ? `${verified.resolutionMetersPerPixel ?? '?'} m/px`
                          : layer.id}
                      </span>
                    </button>
                  )
                })}
                <p className="text-[9px] leading-relaxed text-ink-faint">
                  Regional HiRISE/CTX orthomosaic renders on top where coverage exists (Jezero
                  inner bbox); global imagery fills the surroundings.
                </p>
              </div>
            ) : null}
          </section>

          <p className="border-t border-line pt-2.5 text-[9px] leading-relaxed text-ink-faint">
            All analysis is derived from the USGS Mars 2020 TRN CTX DTM Mosaic (20 m/px).
            Sub-20 m features (individual rocks) are not resolved. Planning estimates only.
          </p>
        </div>
      </aside>
    </>
  )
}

function FeatureToggle({
  label,
  detail,
  checked,
  onChange,
}: {
  label: string
  detail?: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'flex w-full cursor-pointer items-center justify-between rounded-lg border px-2.5 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70',
        checked ? 'border-cyan/30 bg-cyan/[0.06]' : 'border-line bg-white/[0.02] hover:bg-white/[0.045]',
      )}
    >
      <span>
        <span className="block text-[11px] text-ink">{label}</span>
        {detail ? (
          <span className="mt-0.5 block font-mono text-[9px] text-ink-faint">{detail}</span>
        ) : null}
      </span>
      <span
        className={cn(
          'relative inline-flex h-4.5 w-8 shrink-0 items-center rounded-full transition-colors',
          checked ? 'bg-cyan/80' : 'bg-surface-2',
        )}
        aria-hidden="true"
      >
        <span
          className={cn(
            'inline-block size-3 rounded-full bg-ink transition-transform',
            checked ? 'translate-x-4' : 'translate-x-1',
          )}
        />
      </span>
    </button>
  )
}
