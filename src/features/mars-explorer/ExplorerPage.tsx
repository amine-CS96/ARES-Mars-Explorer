import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Canvas } from '@react-three/fiber'
import { JEZERO_CONFIG } from './regionConfig'
import { TileMap } from './TileMap'
import { TerrainScene } from './TerrainScene'
import { ExplorerHud } from './ExplorerHud'
import { useTileMosaic } from './useTileMosaic'
import { TerrainSampler } from './elevationSampler'
import { useRoverTrack } from './useRoverTrack'
import type { RoverWaypoint } from './roverTrack'

const TILE_SIZE = 256

/**
 * Module C — Jezero Crater surface explorer.
 *
 * 2D pan/zoom tile map (regional HiRISE / CTX) plus a 3D displaced terrain view driven by the
 * committed CTX 20 m DEM pipeline. Cursor readout shows coordinates, elevation and slope class.
 * The rover track is the dated MMGIS waypoints snapshot.
 */

export function ExplorerPage() {
  const config = JEZERO_CONFIG
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d')
  const [activeLayerId, setActiveLayerId] = useState(config.layers[0].id)
  const [center, setCenter] = useState(config.center)
  const [zoom, setZoom] = useState(config.defaultZoom)
  const [cursor, setCursor] = useState<{ lat: number; lon: number } | null>(null)
  const [sampler, setSampler] = useState<TerrainSampler | null>(null)
  const [verticalScale, setVerticalScale] = useState(2.5)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const [mapSize, setMapSize] = useState({ width: 0, height: 0 })

  const activeLayer = useMemo(
    () => config.layers.find((l) => l.id === activeLayerId) ?? config.layers[0],
    [activeLayerId, config.layers],
  )

  // Clamp zoom to the active layer's supported range
  const effectiveZoom = useMemo(
    () =>
      Math.max(
        activeLayer.minZoom ?? config.minZoom,
        Math.min(activeLayer.maxZoom ?? config.maxZoom, zoom),
      ),
    [activeLayer.maxZoom, activeLayer.minZoom, config.maxZoom, config.minZoom, zoom],
  )

  // Observe the map container size
  useEffect(() => {
    const el = mapContainerRef.current
    if (!el) return
    const update = () => {
      const rect = el.getBoundingClientRect()
      setMapSize({ width: Math.floor(rect.width), height: Math.floor(rect.height) })
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [viewMode])

  // Compute visible tiles for the current 2D view
  const visibleTiles = useMemo(() => {
    if (mapSize.width === 0 || mapSize.height === 0) return []
    return computeVisibleTiles(center, effectiveZoom, mapSize)
  }, [center, effectiveZoom, mapSize])

  const mosaic = useTileMosaic(activeLayer, visibleTiles)

  // Load DEM metadata
  const metadataQuery = useQuery<{
    elevation: { minMeters: number; maxMeters: number }
    bbox: { west: number; south: number; east: number; north: number }
  }>({
    queryKey: ['dem-metadata', config.dem.metadataPath],
    queryFn: async ({ signal }) => {
      const response = await fetch(config.dem.metadataPath, { signal })
      if (!response.ok) throw new Error(`DEM metadata fetch failed: ${response.status}`)
      return response.json()
    },
    staleTime: Number.POSITIVE_INFINITY,
    retry: 1,
  })

  const roverTrack = useRoverTrack(config.roverTrackPath)

  // Initialize the terrain sampler once
  useEffect(() => {
    let cancelled = false
    const ts = new TerrainSampler(
      config.dem.heightmapPath,
      config.dem.slopePath,
      config.dem.metadataPath,
    )
    ts.load()
      .then(() => {
        if (!cancelled) setSampler(ts)
      })
      .catch((err) => {
        console.error('Terrain sampler failed to load:', err)
      })
    return () => {
      cancelled = true
    }
  }, [config.dem.heightmapPath, config.dem.slopePath, config.dem.metadataPath])

  // Terrain sample is derived from cursor + loaded sampler (no effect setState)
  const terrainSample = useMemo(() => {
    if (!cursor || !sampler) return null
    return sampler.sample(cursor.lat, cursor.lon)
  }, [cursor, sampler])

  const handleCursorMove = useCallback((point: { lat: number; lon: number } | null) => {
    setCursor(point)
  }, [])

  const demMetadata = useMemo(() => {
    if (!metadataQuery.data) return null
    return metadataQuery.data
  }, [metadataQuery.data])

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="animate-fade-up">
        <p className="eyebrow mb-2">Module C · Surface exploration</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-bold tracking-wide text-ink sm:text-4xl">
            Jezero Crater Explorer
          </h1>
          <span className="rounded border border-success/40 bg-success/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-success">
            Verified regional tiles
          </span>
          <span className="rounded border border-accent/40 bg-accent/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-accent">
            DEM pipeline
          </span>
        </div>
        <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-ink-dim">
          Pan and zoom through Perseverance's neighborhood. The 2D map streams verified HiRISE
          (25 cm) and CTX (6 m) tiles from NASA Mars Trek; the 3D view displaces real terrain from
          the USGS CTX 20 m DEM. Hover for coordinates, elevation and slope.
        </p>
      </div>

      <div
        ref={mapContainerRef}
        className="relative mt-8 h-[540px] overflow-hidden rounded-xl border border-line bg-surface shadow-panel sm:h-[600px] lg:h-[660px]"
      >
        {viewMode === '2d' ? (
          <>
            <TileMap
              config={config}
              zoom={effectiveZoom}
              center={center}
              onCenterChange={setCenter}
              onZoomChange={setZoom}
              onCursor={handleCursorMove}
              mosaic={mosaic}
            />
            {roverTrack.data ? (
              <RoverTrackOverlay
                waypoints={roverTrack.data.waypoints}
                center={center}
                zoom={effectiveZoom}
                size={mapSize}
              />
            ) : null}
            {mosaic.query.data && mosaic.query.data.tilesFailed > 0 ? (
              <p className="absolute left-3 top-24 z-30 flex items-center gap-2 rounded-lg border border-amber/30 bg-amber/5 px-3 py-2 text-xs text-amber">
                <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
                <span>
                  {mosaic.query.data.tilesFailed} tiles unavailable — shown dark. ARES does not
                  substitute missing pixels.
                </span>
              </p>
            ) : null}
          </>
        ) : (
          <Canvas camera={{ fov: 50, near: 0.1, far: 200 }}>
            <TerrainScene config={config} demMetadata={demMetadata} verticalScale={verticalScale} />
          </Canvas>
        )}

        <ExplorerHud
          layers={config.layers}
          activeLayerId={activeLayerId}
          onLayerChange={setActiveLayerId}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          cursor={cursor}
          terrain={terrainSample}
          verticalScale={verticalScale}
          onVerticalScaleChange={setVerticalScale}
        />
      </div>

      <footer className="mt-8 space-y-1.5 rounded-xl border border-line bg-surface/50 p-4 text-[11px] leading-relaxed text-ink-faint">
        <p>
          <span className="font-mono uppercase tracking-wider text-cyan/90">Imagery</span> — live
          regional WMTS tiles from NASA Mars Trek. HiRISE layer bbox and zoom range derived from
          the layer's GetCapabilities (K-3 resolved); CTX layer uses the same Trek matrix set with
          its zoom range verified by live tile requests.
        </p>
        <p>
          <span className="font-mono uppercase tracking-wider text-cyan/90">Elevation & slope</span>{' '}
          — generated from the USGS Mars 2020 TRN CTX DTM Mosaic (20 m/px) via the Node pipeline
          (geotiff.js + sharp). Elevation is measured relative to the MOLA areoid; slope is derived
          by Horn finite differences. Precision of the encoded heightmap: ~0.02 m per level.
        </p>
        <p>
          <span className="font-mono uppercase tracking-wider text-cyan/90">Rover track</span> —
          dated snapshot of the MMGIS Perseverance waypoint feed. Interactive planning outputs are
          estimates, never certified flight-safety products.
        </p>
      </footer>
    </div>
  )
}

/** 2D SVG overlay of the rover track, clipped to the current viewport. */
function RoverTrackOverlay({
  waypoints,
  center,
  zoom,
  size,
}: {
  waypoints: RoverWaypoint[]
  center: { lat: number; lon: number }
  zoom: number
  size: { width: number; height: number }
}) {
  const points = useMemo(() => {
    if (size.width === 0 || size.height === 0) return []
    const cols = 2 ** (zoom + 1)
    const rows = 2 ** zoom
    const worldW = cols * TILE_SIZE
    const worldH = rows * TILE_SIZE
    const centerPx = {
      x: ((center.lon + 180) / 360) * worldW,
      y: ((90 - center.lat) / 180) * worldH,
    }
    const topLeft = { x: centerPx.x - size.width / 2, y: centerPx.y - size.height / 2 }

    return waypoints.map((wp) => {
      const px = ((wp.lon + 180) / 360) * worldW - topLeft.x
      const py = ((90 - wp.lat) / 180) * worldH - topLeft.y
      return { x: px, y: py }
    })
  }, [waypoints, center, zoom, size])

  if (points.length === 0) return null

  return (
    <svg className="pointer-events-none absolute inset-0 z-20" width={size.width} height={size.height}>
      <polyline
        points={points.map((p) => `${p.x},${p.y}`).join(' ')}
        fill="none"
        stroke="#53d6e8"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={0.85}
      />
      {points.length > 0 ? (
        <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={4} fill="#e56b3f" />
      ) : null}
    </svg>
  )
}

function computeVisibleTiles(
  center: { lat: number; lon: number },
  zoom: number,
  size: { width: number; height: number },
) {
  const cols = 2 ** (zoom + 1)
  const rows = 2 ** zoom
  const worldW = cols * TILE_SIZE
  const worldH = rows * TILE_SIZE
  const centerPx = {
    x: ((center.lon + 180) / 360) * worldW,
    y: ((90 - center.lat) / 180) * worldH,
  }
  const topLeft = { x: centerPx.x - size.width / 2, y: centerPx.y - size.height / 2 }
  const bottomRight = { x: topLeft.x + size.width, y: topLeft.y + size.height }

  const minX = Math.floor(topLeft.x / TILE_SIZE)
  const maxX = Math.floor(bottomRight.x / TILE_SIZE)
  const minY = Math.floor(topLeft.y / TILE_SIZE)
  const maxY = Math.floor(bottomRight.y / TILE_SIZE)

  const tiles: { z: number; x: number; y: number }[] = []
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (x >= 0 && x < cols && y >= 0 && y < rows) tiles.push({ z: zoom, x, y })
    }
  }
  return tiles
}
