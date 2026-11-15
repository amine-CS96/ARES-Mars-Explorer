import { AlertTriangle, RefreshCw } from 'lucide-react'
import { MOLA_COLOR_HILLSHADE, buildTrekTileUrl } from '@/services/nasa/marsTrekProvider'
import { Button } from '@/components/ui/button'

export type GlobeFallbackReason = 'no-webgl' | 'webgl-error' | 'data-unavailable'

const REASONS: Record<GlobeFallbackReason, { title: string; body: string }> = {
  'no-webgl': {
    title: '3D view unavailable — WebGL not supported',
    body: 'This browser or device does not expose WebGL, which the globe needs. Below is the same MGS MOLA color-hillshade mosaic as a flat map, served live from NASA Mars Trek — the real data, without the 3D.',
  },
  'webgl-error': {
    title: '3D view stopped unexpectedly',
    body: 'The WebGL context failed while rendering. The flat mosaic below is the live NASA Mars Trek data the globe uses. Reloading the page usually restores 3D mode.',
  },
  'data-unavailable': {
    title: 'Mosaic data unavailable right now',
    body: 'The Mars Trek tile service could not be reached, so no planet texture can be composed. ARES does not substitute fake imagery — retry, or visit the Data Sources page for endpoint credits and status.',
  },
}

interface GlobeFallbackProps {
  reason: GlobeFallbackReason
  /** Offered for 'data-unavailable' so the user can retry the fetch. */
  onRetry?: () => void
}

/**
 * Honest failure surface for the globe (docs/ARCHITECTURE.md §6): a real, live flat mosaic
 * plus an explanation — never a decorative fake planet.
 */
export function GlobeFallback({ reason, onRetry }: GlobeFallbackProps) {
  const layer = MOLA_COLOR_HILLSHADE
  const tiles = [
    buildTrekTileUrl(layer, { z: 0, x: 0, y: 0 }),
    buildTrekTileUrl(layer, { z: 0, x: 1, y: 0 }),
  ]
  const info = REASONS[reason]

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-6 py-10 text-center">
      <AlertTriangle className="size-8 text-amber" aria-hidden="true" />
      <div className="max-w-xl space-y-2">
        <h3 className="font-display text-lg font-bold tracking-wide text-ink">{info.title}</h3>
        <p className="text-sm leading-relaxed text-ink-dim">{info.body}</p>
      </div>

      <div className="w-full max-w-2xl">
        <div className="relative aspect-[2/1] overflow-hidden rounded-xl border border-line bg-surface">
          <div className="absolute inset-0 flex">
            {tiles.map((src) => (
              <img
                key={src}
                src={src}
                alt=""
                className="h-full w-1/2 object-cover"
                onError={(e) => {
                  ;(e.currentTarget as HTMLImageElement).style.visibility = 'hidden'
                }}
              />
            ))}
          </div>
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-space/70 to-transparent"
          />
          <span className="absolute bottom-2 left-3 rounded bg-space/70 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-cyan">
            Flat fallback · MGS MOLA color hillshade · 463 m/px
          </span>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-ink-faint">
          Served live from NASA Mars Trek WMTS · Credit NASA/JPL-Caltech/USGS Astrogeology
        </p>
      </div>

      {reason === 'data-unavailable' && onRetry ? (
        <Button variant="outline" onClick={onRetry} className="gap-2">
          <RefreshCw className="size-4" />
          Retry tile fetch
        </Button>
      ) : null}
    </div>
  )
}
