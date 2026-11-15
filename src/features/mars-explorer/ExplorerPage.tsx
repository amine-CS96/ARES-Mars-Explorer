import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import {
  JEZERO_CONFIG,
  TerrainScene,
  useTileMosaic,
  TerrainSampler,
  computeVisibleTiles,
  TILE_SIZE,
} from './'
import {
  getVerifiedLayer,
  VERIFIED_GLOBAL_LAYERS,
  VERIFIED_REGIONAL_LAYERS,
} from '@/services/nasa/marsTrekProvider'
import type { TrekLayer } from '@/services/nasa/types'
import { parseElevationMetadata } from '@/engines/terrain/terrainGrid'
import type { LatLon } from '@/types/geo'
import { places } from '@/data/places'
import { useRoverTrack } from './useRoverTrack'
import type { RoverWaypoint } from './roverTrack'
import { MapCanvas } from './components/MapCanvas'
import { LayerPanel } from './components/LayerPanel'
import { InspectorPanel } from './components/InspectorPanel'
import { MapToolbar } from './components/MapToolbar'
import { ScaleBar } from './components/ScaleBar'
import { CoordinateBar } from './components/CoordinateBar'
import { GridOverlay } from './components/GridOverlay'
import { CoverageBoundary } from './components/CoverageBoundary'
import { MeasurementOverlay } from './components/MeasurementOverlay'
import { ProfileOverlay } from './components/ProfileOverlay'


export type ExplorerTool = 'navigate' | 'inspect' | 'measure' | 'profile'

const DEFAULT_BASE_LAYER = VERIFIED_GLOBAL_LAYERS[0].id
const DEFAULT_OVERLAY_LAYER = VERIFIED_REGIONAL_LAYERS[0].id

/** Clamp a requested viewport zoom to the tiles a layer actually serves. */
function clampTileZoom(layer: TrekLayer | undefined, viewportZoom: number): number {
  if (!layer) return viewportZoom
  const min = layer.minZoom ?? 0
  const max = layer.maxZoom ?? 18
  return Math.max(min, Math.min(max, viewportZoom))
}

function haversineMeters(a: LatLon, b: LatLon): number {
  const R = 3_389_500
  const toRad = Math.PI / 180
  const dLat = (b.lat - a.lat) * toRad
  const dLon = (b.lon - a.lon) * toRad
  const lat1 = a.lat * toRad
  const lat2 = b.lat * toRad
  const sinDLat2 = Math.sin(dLat / 2)
  const sinDLon2 = Math.sin(dLon / 2)
  const h = sinDLat2 * sinDLat2 + Math.cos(lat1) * Math.cos(lat2) * sinDLon2 * sinDLon2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export function ExplorerPage() {
  const config = JEZERO_CONFIG
  const [searchParams] = useSearchParams()

  // View state
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d')
  const [center, setCenter] = useState<{ lat: number; lon: number }>(() => {
    const lat = Number.parseFloat(searchParams.get('lat') ?? '')
    const lon = Number.parseFloat(searchParams.get('lon') ?? '')
    if (
      Number.isFinite(lat) &&
      Number.isFinite(lon) &&
      lon >= config.bbox.west &&
      lon <= config.bbox.east &&
      lat >= config.bbox.south &&
      lat <= config.bbox.north
    ) {
      return { lat, lon }
    }
    return config.center
  })
  const [zoom, setZoom] = useState(config.defaultZoom)
  const [verticalScale, setVerticalScale] = useState(2.5)

  // Layer state
  const [baseLayerId, setBaseLayerId] = useState(DEFAULT_BASE_LAYER)
  const [overlayLayerId, setOverlayLayerId] = useState<string | null>(DEFAULT_OVERLAY_LAYER)
  const [overlayOpacity, setOverlayOpacity] = useState(1)
  const [showGrid, setShowGrid] = useState(false)
  const [showCoverageBoundary, setShowCoverageBoundary] = useState(true)
  const [showRoverTrack, setShowRoverTrack] = useState(true)

  // Tools
  const [activeTool, setActiveTool] = useState<ExplorerTool>('navigate')
  const [cursor, setCursor] = useState<LatLon | null>(null)
  const [inspectedPoint, setInspectedPoint] = useState<LatLon | null>(null)
  const [measurementPoints, setMeasurementPoints] = useState<LatLon[]>([])
  const [profilePoints, setProfilePoints] = useState<LatLon[]>([])

  // UI panels
  const [layerPanelOpen, setLayerPanelOpen] = useState(true)
  const [inspectorOpen, setInspectorOpen] = useState(false)

  const mapContainerRef = useRef<HTMLDivElement>(null)
  const [mapSize, setMapSize] = useState({ width: 0, height: 0 })

  const baseLayer = useMemo(
    () => getVerifiedLayer(baseLayerId) ?? VERIFIED_GLOBAL_LAYERS[0],
    [baseLayerId],
  )
  const overlayLayer = useMemo(
    () => (overlayLayerId ? getVerifiedLayer(overlayLayerId) ?? null : null),
    [overlayLayerId],
  )

  // Effective zoom is clamped to the regional config bounds, then each layer uses its own tile zoom.
  const effectiveZoom = useMemo(
    () => Math.max(config.minZoom, Math.min(config.maxZoom, zoom)),
    [config.maxZoom, config.minZoom, zoom],
  )
  const baseTileZoom = useMemo(() => clampTileZoom(baseLayer, effectiveZoom), [baseLayer, effectiveZoom])
  const overlayTileZoom = useMemo(
    () => (overlayLayer ? clampTileZoom(overlayLayer, effectiveZoom) : effectiveZoom),
    [overlayLayer, effectiveZoom],
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

  // Visible tiles for base and overlay layers
  const baseVisibleTiles = useMemo(() => {
    if (mapSize.width === 0 || mapSize.height === 0) return []
    return computeVisibleTiles(center, baseTileZoom, mapSize)
  }, [center, baseTileZoom, mapSize])
  const overlayVisibleTiles = useMemo(() => {
    if (mapSize.width === 0 || mapSize.height === 0 || !overlayLayer) return []
    return computeVisibleTiles(center, overlayTileZoom, mapSize)
  }, [center, overlayTileZoom, mapSize, overlayLayer])

  const baseMosaic = useTileMosaic(baseLayer, baseVisibleTiles)
  const overlayMosaic = useTileMosaic(overlayLayer ?? baseLayer, overlayVisibleTiles)

  // Load DEM metadata and sampler
  const metadataQuery = useQuery<{
    elevation: { minMeters: number; maxMeters: number }
    bbox: { west: number; south: number; east: number; north: number }
  }>({
    queryKey: ['dem-metadata', config.dem.metadataPath],
    queryFn: async ({ signal }) => {
      const response = await fetch(config.dem.metadataPath, { signal })
      if (!response.ok) {
        throw new Error(`DEM metadata request failed: HTTP ${response.status}`)
      }
      const contentType = response.headers.get('content-type') ?? ''
      if (!contentType.includes('json')) {
        throw new Error(
          `DEM metadata returned unexpected content type "${contentType}" (expected JSON)`,
        )
      }
      return parseElevationMetadata(await response.json())
    },
    staleTime: Number.POSITIVE_INFINITY,
    retry: 1,
  })

  const roverTrack = useRoverTrack(config.roverTrackPath)

  const [sampler, setSampler] = useState<TerrainSampler | null>(null)
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

  // Terrain samples for cursor, inspected point, and profile line
  const cursorTerrain = useMemo(() => {
    if (!cursor || !sampler) return null
    return sampler.sample(cursor.lat, cursor.lon)
  }, [cursor, sampler])

  const inspectedTerrain = useMemo(() => {
    if (!inspectedPoint || !sampler) return null
    return sampler.sample(inspectedPoint.lat, inspectedPoint.lon)
  }, [inspectedPoint, sampler])

  const profileSamples = useMemo(() => {
    if (profilePoints.length < 2 || !sampler) return []
    const [start, end] = [profilePoints[0], profilePoints[profilePoints.length - 1]]
    const steps = 60
    const samples = []
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const lat = start.lat + (end.lat - start.lat) * t
      const lon = start.lon + (end.lon - start.lon) * t
      const sample = sampler.sample(lat, lon)
      if (sample) samples.push({ lat, lon, distanceM: haversineMeters(start, { lat, lon }), ...sample })
    }
    return samples
  }, [profilePoints, sampler])

  const handleCursorMove = useCallback((point: LatLon | null) => {
    setCursor(point)
  }, [])

  const handleMapClick = useCallback(
    (point: LatLon) => {
      if (activeTool === 'inspect') {
        setInspectedPoint(point)
        setInspectorOpen(true)
      } else if (activeTool === 'measure') {
        setMeasurementPoints((prev) => {
          const next = [...prev, point]
          return next.length > 2 ? [point] : next
        })
      } else if (activeTool === 'profile') {
        setProfilePoints((prev) => {
          const next = [...prev, point]
          return next.length > 2 ? [point] : next
        })
      }
    },
    [activeTool],
  )

  const resetView = useCallback(() => {
    setCenter(config.center)
    setZoom(config.defaultZoom)
    setInspectedPoint(null)
    setMeasurementPoints([])
    setProfilePoints([])
  }, [config.center, config.defaultZoom])

  const quickLocations = useMemo(
    () =>
      places
        .filter((p) => p.region === 'jezero-crater' || p.id === 'jezero-crater')
        .map((p) => ({
          name: p.name,
          lat: p.coordinates.lat,
          lon: p.coordinates.lon,
          zoom: p.category === 'landing-site' || p.category === 'mission' ? 14 : 12,
        })),
    [],
  )

  const activeLayerName = overlayLayer?.title ?? baseLayer.title

  // Coverage boundaries to render
  const boundaries = useMemo(
    () => [
      {
        id: 'dem',
        name: 'DEM coverage',
        color: '#53d6e8',
        bbox: config.bbox,
      },
      ...(overlayLayer?.bbox && overlayLayer.id !== 'JEZ_ctx_B_soc_008_orthoMosaic_6m_Eqc_latTs0_lon0'
        ? [
            {
              id: 'overlay',
              name: overlayLayer.title,
              color: '#fbbf24',
              bbox: overlayLayer.bbox,
            },
          ]
        : []),
    ],
    [config.bbox, overlayLayer],
  )

  const totalFailed = (baseMosaic.query.data?.tilesFailed ?? 0) + (overlayMosaic.query.data?.tilesFailed ?? 0)
  const totalLoaded = (baseMosaic.query.data?.tilesTotal ?? 0) + (overlayMosaic.query.data?.tilesTotal ?? 0)
  const loadedCount = totalFailed > 0 ? totalLoaded - totalFailed : totalLoaded

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col overflow-hidden bg-space">
      {/* Page header — kept compact so the map remains the focus */}
      <header className="border-b border-line bg-space/95 px-4 py-3 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow mb-1 text-[9px]">Surface exploration</p>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-xl font-bold tracking-wide text-ink sm:text-2xl">
                Jezero Crater Explorer
              </h1>
              <span className="rounded border border-success/40 bg-success/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-success">
                Verified regional tiles
              </span>
              <span className="rounded border border-accent/40 bg-accent/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-accent">
                Derived elevation
              </span>
            </div>
          </div>
          <p className="max-w-md text-[11px] leading-relaxed text-ink-dim">
            Pan and zoom through Perseverance&apos;s neighborhood. Switch base maps and regional
            overlays, inspect terrain, measure distances and draw elevation profiles.
          </p>
        </div>
      </header>

      {/* Top toolbar */}
      <MapToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onResetView={resetView}
        onToggleLayerPanel={() => setLayerPanelOpen((v) => !v)}
        quickLocations={quickLocations}
        onQuickLocation={(loc) => {
          setCenter({ lat: loc.lat, lon: loc.lon })
          setZoom(loc.zoom)
        }}
      />

      <div className="relative flex flex-1 overflow-hidden">
        {/* Left layer panel */}
        <LayerPanel
          baseLayerId={baseLayerId}
          onBaseLayerChange={setBaseLayerId}
          overlayLayerId={overlayLayerId}
          onOverlayLayerChange={setOverlayLayerId}
          overlayOpacity={overlayOpacity}
          onOverlayOpacityChange={setOverlayOpacity}
          showGrid={showGrid}
          onShowGridChange={setShowGrid}
          showCoverageBoundary={showCoverageBoundary}
          onShowCoverageBoundaryChange={setShowCoverageBoundary}
          showRoverTrack={showRoverTrack}
          onShowRoverTrackChange={setShowRoverTrack}
          activeTool={activeTool}
          onActiveToolChange={(tool) => {
            setActiveTool(tool)
            if (tool === 'navigate') {
              setInspectedPoint(null)
              setMeasurementPoints([])
              setProfilePoints([])
            }
          }}
          isOpen={layerPanelOpen}
          onClose={() => setLayerPanelOpen(false)}
        />

        {/* Main map area */}
        <div ref={mapContainerRef} className="relative flex-1 overflow-hidden bg-space">
          {viewMode === '2d' ? (
            <>
              <MapCanvas
                config={config}
                zoom={effectiveZoom}
                center={center}
                onCenterChange={setCenter}
                onZoomChange={setZoom}
                onCursor={handleCursorMove}
                onClick={handleMapClick}
                baseMosaic={baseMosaic}
                baseTileZoom={baseTileZoom}
                overlayMosaic={overlayLayer ? overlayMosaic : undefined}
                overlayTileZoom={overlayLayer ? overlayTileZoom : undefined}
                overlayOpacity={overlayOpacity}
              />
              {showGrid ? (
                <GridOverlay
                  center={center}
                  zoom={effectiveZoom}
                  size={mapSize}
                  visible={showGrid}
                />
              ) : null}
              {showRoverTrack && roverTrack.data ? (
                <RoverTrackOverlay
                  waypoints={roverTrack.data.waypoints}
                  center={center}
                  zoom={effectiveZoom}
                  size={mapSize}
                />
              ) : null}
              {showCoverageBoundary ? (
                <CoverageBoundary
                  boundaries={boundaries}
                  center={center}
                  zoom={effectiveZoom}
                  size={mapSize}
                  visible={showCoverageBoundary}
                />
              ) : null}
              {measurementPoints.length > 0 ? (
                <MeasurementOverlay
                  points={measurementPoints}
                  center={center}
                  zoom={effectiveZoom}
                  size={mapSize}
                />
              ) : null}
              {profilePoints.length > 0 ? (
                <ProfileOverlay
                  points={profilePoints}
                  center={center}
                  zoom={effectiveZoom}
                  size={mapSize}
                />
              ) : null}
              {totalFailed > 0 ? (
                <div className="pointer-events-none absolute left-3 top-14 z-30 flex items-center gap-2 rounded-lg border border-amber/30 bg-amber/5 px-3 py-2 text-xs text-amber">
                  <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
                  <span>
                    {totalFailed} tiles unavailable — shown dark. ARES does not substitute missing
                    pixels.
                  </span>
                </div>
              ) : null}
            </>
          ) : (
            <>
              <Canvas camera={{ fov: 50, near: 0.1, far: 200 }}>
                <TerrainScene
                  config={config}
                  demMetadata={metadataQuery.data ?? null}
                  verticalScale={verticalScale}
                />
              </Canvas>
              <div className="pointer-events-auto absolute right-4 top-4 z-30 rounded-lg border border-line bg-space/85 p-2 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-ink-dim">Vertical exaggeration</span>
                  <input
                    type="range"
                    min={1}
                    max={6}
                    step={0.5}
                    value={verticalScale}
                    onChange={(e) => setVerticalScale(Number.parseFloat(e.target.value))}
                    className="h-1 w-24 cursor-pointer appearance-none rounded bg-surface-2 accent-cyan"
                    aria-label="Vertical exaggeration"
                  />
                  <span className="font-mono text-[9px] text-ink-dim">{verticalScale.toFixed(1)}×</span>
                </div>
              </div>
            </>
          )}

          {/* Floating scale bar */}
          <div className="pointer-events-none absolute bottom-10 left-4 z-30">
            <ScaleBar zoom={effectiveZoom} latitude={center.lat} />
          </div>

          {/* Cursor readout (compact, top-left inside map) */}
          <div className="pointer-events-none absolute left-4 top-4 z-30 rounded-lg border border-line bg-space/85 px-3 py-2 backdrop-blur-md">
            <p className="font-mono text-[10px] text-cyan/90">
              {cursor ? `${cursor.lat.toFixed(5)}°N, ${cursor.lon.toFixed(5)}°E` : 'Cursor — hover the map'}
            </p>
            {cursorTerrain ? (
              <p className="font-mono text-[10px] text-ink">
                Elev {cursorTerrain.elevationMeters.toFixed(1)} m · Slope {cursorTerrain.slopeDegrees.toFixed(1)}°
              </p>
            ) : null}
          </div>
        </div>

        {/* Right inspector panel */}
        <InspectorPanel
          inspectedPoint={inspectedPoint}
          terrain={inspectedTerrain}
          profileSamples={profileSamples}
          isOpen={inspectorOpen}
          onClose={() => setInspectorOpen(false)}
        />
      </div>

      {/* Bottom coordinate/status bar */}
      <CoordinateBar
        cursor={cursor}
        center={center}
        zoom={effectiveZoom}
        activeLayerName={activeLayerName}
        tileStatus={{
          loaded: loadedCount,
          total: totalLoaded,
          failed: totalFailed,
        }}
      />
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
    return waypoints
      .map((wp) => {
        const worldX = ((wp.lon + 180) / 360) * worldW
        const worldY = ((90 - wp.lat) / 180) * worldH
        return { x: worldX - topLeft.x, y: worldY - topLeft.y }
      })
      .filter((p) => p.x >= -50 && p.x <= size.width + 50 && p.y >= -50 && p.y <= size.height + 50)
  }, [waypoints, center, zoom, size])

  if (points.length < 2) return null

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')

  return (
    <svg className="pointer-events-none absolute inset-0 z-20" width={size.width} height={size.height}>
      <path
        d={pathD}
        fill="none"
        stroke="#e56b3f"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.9}
      />
      {points.map((p, i) =>
        i % 10 === 0 ? (
          <circle key={i} cx={p.x} cy={p.y} r={2} fill="#f5f7fa" opacity={0.8} />
        ) : null,
      )}
    </svg>
  )
}
