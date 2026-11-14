import { useCallback, useRef, useState } from 'react'
import { Satellite } from 'lucide-react'
import type { LatLon } from '@/types/geo'
import type { PointOfInterest } from '@/types/poi'
import { places } from '@/data/places'
import {
  MOLA_COLOR_HILLSHADE,
  VERIFIED_GLOBAL_LAYERS,
  getVerifiedLayer,
} from '@/services/nasa/marsTrekProvider'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { PoiDetailDialog } from '@/features/points-of-interest'
import { GlobeCanvas } from './GlobeCanvas'
import { GlobeFallback } from './GlobeFallback'
import { GlobeHud } from './GlobeHud'
import { GlobeSiteRail } from './GlobeSiteRail'
import { useGlobeMosaic } from './useGlobeMosaic'
import { GLOBE_TIERS, oneTierLower, shouldDowngradeTier, type GlobeTierId } from './math'

/**
 * Module B — 3D Mars globe. Texture is composed live from verified Mars Trek WMTS tiles
 * (derived, per-tile failures disclosed); markers come from the Atlas catalog with their
 * accuracy labels; quality tiers + auto-downgrade keep it smooth; failures degrade to a real
 * flat mosaic instead of a fake planet. See docs/DEVELOPMENT_ROADMAP.md Phase 2.
 */

/** Global layers offered for the globe texture (all tile-verified live, 2:1 EQ grid). */
const GLOBE_LAYER_IDS: readonly string[] = [
  'Mars_MGS_MOLA_ClrShade_merge_global_463m',
  'Mars_Viking_MDIM21_ClrMosaic_global_232m',
  'Mars_MOLA_blend200ppx_HRSC_ClrShade_clon0dd_200mpp_lzw',
]

export function GlobePage() {
  const [tierId, setTierId] = useState<GlobeTierId>('medium')
  const [tierSource, setTierSource] = useState<'user' | 'auto'>('user')
  const [autoQuality, setAutoQuality] = useState(true)
  const [layerId, setLayerId] = useState<string>(GLOBE_LAYER_IDS[0])
  const [graticule, setGraticule] = useState(true)
  const [autoRotate, setAutoRotate] = useState(true)
  const [fps, setFps] = useState(0)
  const [cursor, setCursor] = useState<LatLon | null>(null)
  const [selected, setSelected] = useState<PointOfInterest | null>(null)
  const [focus, setFocus] = useState<LatLon | null>(null)
  const [focusNonce, setFocusNonce] = useState(0)
  const reducedMotion = usePrefersReducedMotion()

  const layer = getVerifiedLayer(layerId) ?? MOLA_COLOR_HILLSHADE
  const tier = GLOBE_TIERS[tierId]
  const { query, progress } = useGlobeMosaic(layer, tier.mosaicZoom)

  const fpsBufferRef = useRef<number[]>([])
  const handleFpsSample = useCallback(
    (sample: number) => {
      setFps(sample)
      const buffer = fpsBufferRef.current
      buffer.push(sample)
      if (buffer.length > 6) buffer.shift()
      if (buffer.length === 6) {
        const avg = buffer.reduce((sum, value) => sum + value, 0) / buffer.length
        if (shouldDowngradeTier(avg, tierId, autoQuality)) {
          setTierId((current) => oneTierLower(current))
          setTierSource('auto')
          buffer.length = 0
        }
      }
    },
    [tierId, autoQuality],
  )

  const selectPlace = useCallback((place: PointOfInterest) => {
    setSelected(place)
    setFocus({ ...place.coordinates })
    setFocusNonce((nonce) => nonce + 1)
  }, [])

  const loading = query.isPending || (!query.data && query.isFetching)
  const switching = query.isFetching && query.isPlaceholderData
  const mosaic = query.data

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="animate-fade-up">
        <p className="eyebrow mb-2">Module B · Interactive globe</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-bold tracking-wide text-ink sm:text-4xl">
            3D Mars Globe
          </h1>
          <span className="rounded border border-success/40 bg-success/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-success">
            Live tiles · verified
          </span>
          <span className="rounded border border-accent/40 bg-accent/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-accent">
            Derived composite
          </span>
        </div>
        <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-ink-dim">
          Rotate and zoom the real planet. The texture is composed in your browser from NASA Mars
          Trek WMTS tiles (MGS MOLA color hillshade base, verified live); markers are Atlas sites
          carrying their accuracy labels. Drag to rotate · scroll or pinch to zoom · click a
          marker for its full record.
        </p>
      </div>

      <div className="relative mt-8 h-[540px] overflow-hidden rounded-xl border border-line bg-surface shadow-panel sm:h-[600px] lg:h-[660px]">
        {/* Fallback underlay while the mosaic composes (same treatment as the hero strip). */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_30%_38%,#7a3a20_0%,#3f1f12_45%,#161e2d_100%)]"
        />

        {query.isError && !mosaic ? (
          <GlobeFallback reason="data-unavailable" onRetry={() => void query.refetch()} />
        ) : mosaic ? (
          <GlobeCanvas
            canvas={mosaic.canvas}
            tier={tier}
            places={places}
            selectedId={selected?.id ?? null}
            focus={focus}
            focusNonce={focusNonce}
            reducedMotion={reducedMotion}
            graticule={graticule}
            autoRotate={autoRotate}
            onPlaceSelect={selectPlace}
            onFpsSample={handleFpsSample}
            onCursorLatLon={setCursor}
          />
        ) : null}

        {loading ? (
          <GlobeLoadingOverlay progress={progress} tier={tierId} />
        ) : switching ? (
          <GlobeLoadingOverlay progress={progress} tier={tierId} compact />
        ) : null}

        {mosaic ? (
          <GlobeHud
            layer={layer}
            layerId={layerId}
            onLayerChange={setLayerId}
            layers={VERIFIED_GLOBAL_LAYERS.filter((candidate) =>
              GLOBE_LAYER_IDS.includes(candidate.id),
            )}
            tierId={tierId}
            tierSource={tierSource}
            onTierChange={(id) => {
              setTierId(id)
              setTierSource('user')
            }}
            autoQuality={autoQuality}
            onAutoQualityChange={setAutoQuality}
            fps={fps}
            cursor={cursor}
            graticule={graticule}
            onGraticuleChange={setGraticule}
            autoRotate={autoRotate}
            onAutoRotateChange={setAutoRotate}
            mosaic={{
              tilesTotal: mosaic.tilesTotal,
              tilesFailed: mosaic.tilesFailed,
              textureWidth: mosaic.width,
              textureHeight: mosaic.height,
            }}
          />
        ) : null}
      </div>

      {mosaic && mosaic.tilesFailed > 0 ? (
        <p className="mt-4 flex items-start gap-2 rounded-lg border border-amber/30 bg-amber/5 px-3 py-2 text-xs text-amber">
          <Satellite className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            {mosaic.tilesFailed} of {mosaic.tilesTotal} tiles did not load for this view — those
            areas are shown dark. ARES does not substitute missing pixels.
          </span>
        </p>
      ) : null}

      <div className="mt-8">
        <GlobeSiteRail places={places} selectedId={selected?.id ?? null} onSelect={selectPlace} />
      </div>

      <footer className="mt-8 space-y-1.5 rounded-xl border border-line bg-surface/50 p-4 text-[11px] leading-relaxed text-ink-faint">
        <p>
          <span className="font-mono uppercase tracking-wider text-cyan/90">Texture</span> — live
          composite of verified NASA Mars Trek WMTS tiles ({layer.title}, {layer.instrument},{' '}
          {layer.resolutionMetersPerPixel} m/px), composed client-side from {tier.tileCount} tiles
          at the {tier.label.toLowerCase()} tier. Endpoints verified live from this environment
          (docs/DATA_SOURCES.md §1).
        </p>
        <p>
          <span className="font-mono uppercase tracking-wider text-cyan/90">Markers</span> — Atlas
          catalog coordinates with their accuracy labels (verified / approximate / illustrative);
          the fictional Ares III site is flagged as fiction in its detail record.
        </p>
        <p>
          <span className="font-mono uppercase tracking-wider text-cyan/90">Atmosphere rim</span>{' '}
          — illustrative visual approximation, not a radiative-transfer model (Mars' atmosphere is
          thin). Credit: NASA/JPL-Caltech, USGS Astrogeology, ESA/DLR/FU Berlin per selected
          layer. Interactive 3D planning outputs are estimates, never certified flight-safety
          products.
        </p>
      </footer>

      <PoiDetailDialog
        place={selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
      />
    </div>
  )
}

/** Progress disclosure while verified tiles stream in (bottom strip once a globe exists). */
function GlobeLoadingOverlay({
  progress,
  tier,
  compact = false,
}: {
  progress: { loaded: number; total: number }
  tier: GlobeTierId
  compact?: boolean
}) {
  const total = progress.total || GLOBE_TIERS[tier].tileCount
  const pct = total > 0 ? Math.round((progress.loaded / total) * 100) : 0
  return (
    <div
      className={`absolute inset-x-0 z-40 ${compact ? 'bottom-3 mx-3 flex justify-center' : 'inset-y-0 flex items-center justify-center'}`}
      role="status"
      aria-live="polite"
    >
      <div className="w-full max-w-sm rounded-lg border border-line bg-space/90 p-4 text-center backdrop-blur-md">
        <p className="eyebrow text-[10px]">Composing mosaic · verified WMTS tiles</p>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-cyan transition-[width] duration-200"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 font-mono text-[10px] text-ink-dim">
          {progress.loaded} / {total} tiles · {pct}%
        </p>
      </div>
    </div>
  )
}
