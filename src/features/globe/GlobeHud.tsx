import type { ReactNode } from 'react'
import { Grid3x3, Globe2, Pause, Play, Wifi } from 'lucide-react'
import type { TrekLayer } from '@/services/nasa/types'
import { POI_CATEGORY_LABELS, type PoICategory } from '@/types/poi'
import type { LatLon } from '@/types/geo'
import { formatLatLon } from '@/utils/geo'
import { GLOBE_MATERIAL_COLORS, GLOBE_TIERS, GLOBE_TIER_ORDER, type GlobeTierId } from './math'

/**
 * Overlay instrumentation for the globe panel — mission-control style. Everything here is
 * state disclosure or user control; no science is computed in this layer (ARCHITECTURE §1).
 */

export interface GlobeHudProps {
  layer: TrekLayer
  layerId: string
  onLayerChange: (layerId: string) => void
  layers: TrekLayer[]
  tierId: GlobeTierId
  tierSource: 'user' | 'auto'
  onTierChange: (tierId: GlobeTierId) => void
  autoQuality: boolean
  onAutoQualityChange: (on: boolean) => void
  fps: number
  cursor: LatLon | null
  graticule: boolean
  onGraticuleChange: (on: boolean) => void
  autoRotate: boolean
  onAutoRotateChange: (on: boolean) => void
  mosaic: { tilesTotal: number; tilesFailed: number; textureWidth: number; textureHeight: number }
}

const SHORT_LAYER_NAMES: Record<string, string> = {
  Mars_MGS_MOLA_ClrShade_merge_global_463m: 'MOLA hillshade',
  Mars_Viking_MDIM21_ClrMosaic_global_232m: 'Viking color',
  Mars_MOLA_blend200ppx_HRSC_ClrShade_clon0dd_200mpp_lzw: 'MOLA+HRSC blend',
}

/** Layer-specific credit lines (mission/instrument owners, per docs/DATA_SOURCES.md). */
const LAYER_CREDITS: Record<string, string> = {
  Mars_MGS_MOLA_ClrShade_merge_global_463m: 'NASA/JPL-Caltech/GSFC/MSSS · USGS Astrogeology (MOLA)',
  Mars_Viking_MDIM21_ClrMosaic_global_232m: 'USGS Astrogeology · NASA/JPL (Viking MDIM 2.1)',
  Mars_MOLA_blend200ppx_HRSC_ClrShade_clon0dd_200mpp_lzw:
    'NASA/JPL/USGS · ESA/DLR/FU Berlin (Mars Express HRSC)',
}

export function GlobeHud(props: GlobeHudProps) {
  const { layer } = props
  return (
    <>
      {/* Top-left: texture layer picker */}
      <div className="pointer-events-auto absolute left-3 top-3 z-30 flex flex-col gap-1.5 rounded-lg border border-line bg-space/85 p-2 backdrop-blur-md">
        <span className="eyebrow px-1 text-[9px]">Texture · live WMTS</span>
        <div className="flex gap-1" role="group" aria-label="Texture layer">
          {props.layers.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={option.id === props.layerId}
              onClick={() => props.onLayerChange(option.id)}
              className={`rounded px-2 py-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70 ${
                option.id === props.layerId
                  ? 'bg-cyan/15 text-cyan'
                  : 'text-ink-dim hover:bg-white/[0.05] hover:text-ink'
              }`}
            >
              <span className="block font-mono text-[10px] font-semibold uppercase tracking-wider">
                {SHORT_LAYER_NAMES[option.id] ?? option.title}
              </span>
              <span className="block font-mono text-[9px] text-ink-faint">
                {option.resolutionMetersPerPixel} m/px
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Top-right: quality + FPS */}
      <div className="pointer-events-auto absolute right-3 top-3 z-30 flex flex-col items-end gap-1.5 rounded-lg border border-line bg-space/85 p-2 backdrop-blur-md">
        <span className="eyebrow px-1 text-[9px]">Quality</span>
        <div className="flex gap-1" role="group" aria-label="Quality tier">
          {GLOBE_TIER_ORDER.map((tierId) => (
            <button
              key={tierId}
              type="button"
              aria-pressed={tierId === props.tierId}
              onClick={() => props.onTierChange(tierId)}
              className={`rounded px-2 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70 ${
                tierId === props.tierId
                  ? 'bg-cyan/15 text-cyan'
                  : 'text-ink-dim hover:bg-white/[0.05] hover:text-ink'
              }`}
            >
              {GLOBE_TIERS[tierId].label}
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-pressed={props.autoQuality}
          onClick={() => props.onAutoQualityChange(!props.autoQuality)}
          className="flex items-center gap-1.5 rounded px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-ink-dim transition-colors hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70"
        >
          <Wifi className="size-3" aria-hidden="true" />
          Auto {props.autoQuality ? 'on' : 'off'}
        </button>
        <span className="px-1 font-mono text-[9px] text-ink-faint">
          {props.fps > 0 ? `${props.fps.toFixed(0)} fps` : '— fps'} ·{' '}
          {props.mosaic.textureWidth}×{props.mosaic.textureHeight}
        </span>
      </div>

      {/* Bottom-left: legend + cursor readout */}
      <div className="pointer-events-none absolute bottom-3 left-3 z-30 flex max-w-[62%] flex-col gap-1.5">
        <div className="flex flex-wrap gap-x-3 gap-y-1 rounded-lg border border-line bg-space/85 px-2.5 py-2 backdrop-blur-md">
          {(Object.keys(POI_CATEGORY_LABELS) as PoICategory[]).map((category) => (
            <span
              key={category}
              className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-ink-dim"
            >
              <span
                aria-hidden="true"
                className="inline-block size-2 rounded-full"
                style={{ backgroundColor: GLOBE_MATERIAL_COLORS.markers[category] }}
              />
              {POI_CATEGORY_LABELS[category]}
            </span>
          ))}
        </div>
        <span className="w-fit rounded bg-space/70 px-2 py-1 font-mono text-[10px] text-cyan/90">
          {props.cursor
            ? `Cursor ${formatLatLon(props.cursor, { decimals: 2 })}`
            : 'Cursor — hover the planet'}
        </span>
      </div>

      {/* Bottom-right: attribution + view toggles */}
      <div className="pointer-events-auto absolute bottom-3 right-3 z-30 flex flex-col items-end gap-1.5">
        <div className="flex gap-1">
          <HudToggleButton
            active={props.graticule}
            onClick={() => props.onGraticuleChange(!props.graticule)}
            label={props.graticule ? 'Hide lat/lon grid' : 'Show lat/lon grid'}
          >
            <Grid3x3 className="size-3.5" aria-hidden="true" />
            Grid
          </HudToggleButton>
          <HudToggleButton
            active={props.autoRotate}
            onClick={() => props.onAutoRotateChange(!props.autoRotate)}
            label={props.autoRotate ? 'Pause idle rotation' : 'Resume idle rotation'}
          >
            {props.autoRotate ? (
              <Pause className="size-3.5" aria-hidden="true" />
            ) : (
              <Play className="size-3.5" aria-hidden="true" />
            )}
            Spin
          </HudToggleButton>
        </div>
        <div className="max-w-[280px] rounded-lg border border-line bg-space/85 px-2.5 py-2 text-right backdrop-blur-md">
          <p className="font-mono text-[10px] uppercase tracking-wider text-cyan/90">
            {SHORT_LAYER_NAMES[layer.id] ?? layer.title}
          </p>
          <p className="mt-0.5 font-mono text-[9px] leading-relaxed text-ink-faint">
            {LAYER_CREDITS[layer.id] ?? 'NASA/JPL/USGS'} · {layer.mission}
          </p>
          <p className="mt-0.5 font-mono text-[9px] text-ink-faint">
            Derived composite · {props.mosaic.tilesTotal} verified WMTS tiles
            {props.mosaic.tilesFailed > 0 ? ` · ${props.mosaic.tilesFailed} unavailable` : ''}
          </p>
        </div>
      </div>

      {/* Auto-adjusted quality disclosure */}
      {props.tierSource === 'auto' ? (
        <div className="absolute left-1/2 top-3 z-30 -translate-x-1/2">
          <span className="flex items-center gap-1.5 rounded-full border border-amber/40 bg-space/85 px-3 py-1 font-mono text-[9px] uppercase tracking-wider text-amber backdrop-blur-md">
            <Globe2 className="size-3" aria-hidden="true" />
            Auto quality adjusted for smoothness
          </span>
        </div>
      ) : null}
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
  children: ReactNode
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
