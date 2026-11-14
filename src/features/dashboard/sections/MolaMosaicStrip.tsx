import { MOLA_COLOR_HILLSHADE, buildTrekTileUrl } from '@/services/nasa/marsTrekProvider'

/**
 * The two global tiles (2 cols × 1 row at zoom 0) of the MGS MOLA merged color-hillshade
 * mosaic, served live from NASA Mars Trek WMTS — verified endpoint, 463 m/px. If a tile cannot
 * load (offline/blocked), it hides and the clearly-marked fallback gradient stays visible —
 * ARES never pretends to render the planet when data is unavailable.
 */
export function MolaMosaicStrip() {
  const layer = MOLA_COLOR_HILLSHADE
  const tiles = [
    buildTrekTileUrl(layer, { z: 0, x: 0, y: 0 }),
    buildTrekTileUrl(layer, { z: 0, x: 1, y: 0 }),
  ]

  return (
    <div className="space-y-2">
      <div className="relative aspect-[2/1] overflow-hidden rounded-xl border border-line bg-surface">
        {/* Fallback treatment underneath the images; visible until tiles render. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_35%_40%,#7a3a20_0%,#3f1f12_45%,#161e2d_100%)]"
        />
        <div className="absolute inset-0 flex" data-testid="mola-strip">
          {tiles.map((src, i) => (
            <TileImg key={src} src={src} side={i === 0 ? 'left' : 'right'} />
          ))}
        </div>
        {/* Faint scan grid for the mission-instrument feel */}
        <div aria-hidden="true" className="bg-grid absolute inset-0 opacity-40" />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-space/70 to-transparent"
        />
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between gap-2">
          <span className="rounded bg-space/70 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-cyan backdrop-blur-sm">
            Real data · MGS MOLA color hillshade
          </span>
          <span className="hidden rounded bg-space/70 px-2 py-1 font-mono text-[10px] text-ink-faint backdrop-blur-sm sm:block">
            463 m/px · NASA/JPL/USGS
          </span>
        </div>
      </div>
      <p className="text-[11px] leading-relaxed text-ink-faint">
        Served live from NASA Mars Trek WMTS tiles. The interactive 3D globe built on this
        imagery arrives in Phase 2 — until then, this strip shows the actual mosaic the globe
        will use.
      </p>
    </div>
  )
}

function TileImg({ src, side }: { src: string; side: 'left' | 'right' }) {
  return (
    <img
      src={src}
      alt=""
      loading="eager"
      decoding="async"
      className={`h-full w-1/2 object-cover ${side === 'left' ? 'order-1' : 'order-2'}`}
      onError={(e) => {
        ;(e.currentTarget as HTMLImageElement).style.visibility = 'hidden'
      }}
    />
  )
}
