import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChartColumn,
  ClipboardList,
  Map as MapIcon,
  PanelLeft,
  Route,
  SlidersHorizontal,
} from 'lucide-react'
import {
  JEZERO_CONFIG,
  MapCanvas,
  computeVisibleTiles,
  latLonToPixel,
  useTileMosaic,
  useRoverTrack,
  TerrainLoadError,
} from '@/features/mars-explorer'
import {
  getVerifiedLayer,
  VERIFIED_GLOBAL_LAYERS,
  VERIFIED_REGIONAL_LAYERS,
} from '@/services/nasa/marsTrekProvider'
import { useTerrainGrid } from '@/hooks/useTerrainGrid'
import { analyzeTerrain, type TerrainAnalysis } from '@/engines/hazards/terrainAnalysis'
import { detectHazards, type HazardCluster } from '@/engines/hazards/hazardDetection'
import {
  assessCellRisk,
  getProfileById,
  MOBILITY_PROFILES,
  SEVERITY_COLORS,
  type MobilityProfile,
} from '@/engines/hazards/riskModel'
import {
  computeRouteExposure,
  type RouteExposureResult,
} from '@/engines/hazards/routeExposure'
import { computeAllProfileAccessibility } from '@/engines/hazards/accessibility'
import type { PathNode } from '@/engines/pathfinding/astar'
import { SIMULATOR_ROUTE_KEY, type RouteSummary } from '@/engines/simulation/missionConfig'
import {
  buildSlopeOverlay,
  buildRoughnessOverlay,
  buildReliefOverlay,
  buildAspectOverlay,
  buildRiskOverlay,
  OVERLAY_MODES,
  type HazardOverlayMode,
} from './hazardOverlays'
import { AnalysisPanel } from './components/AnalysisPanel'
import { WorkspaceHeader } from './components/WorkspaceHeader'
import { HazardInventory } from './components/HazardInventory'
import { HazardInspector } from './components/HazardInspector'
import { AssessmentPanel } from './components/AssessmentPanel'
import { AnalyticsPanel } from './components/AnalyticsPanel'
import { RouteExposurePanel } from './components/RouteExposurePanel'
import { ClusterOverlay } from './components/ClusterOverlay'
import { RouteOverlay } from './components/RouteOverlay'
import { RoverTrackOverlay } from './components/RoverTrackOverlay'
import { CursorTooltip } from './components/CursorTooltip'
import { MethodologyDialog } from './components/MethodologyDialog'
import { ScaleBar } from '@/features/mars-explorer/components/ScaleBar'
import { CoordinateBar } from '@/features/mars-explorer/components/CoordinateBar'
import { cn } from '@/utils/cn'
import type { LatLon } from '@/types/geo'
import type { MapOverlay } from '@/features/mars-explorer'
import type { AnalysisExportInput } from './exportAnalysis'
import type { Severity, HazardCategory } from '@/engines/hazards/riskModel'

const DEFAULT_BASE_LAYER = VERIFIED_GLOBAL_LAYERS[0].id
const DEFAULT_OVERLAY_LAYER = VERIFIED_REGIONAL_LAYERS[0].id
const ROUTE_PATH_KEY = 'ares:planner-route-path'

type RightTab = 'inventory' | 'assessment' | 'analytics' | 'route'

interface StoredRoute {
  path: PathNode[]
  /** Dimensions of the cost grid the path indexes, when known (newer format). */
  gridWidth: number | null
  gridHeight: number | null
  /** Planner-reported summary, when still available (the Simulator consumes it after import). */
  summary: RouteSummary | null
}

function readStoredRoute(): StoredRoute | null {
  try {
    const pathRaw = localStorage.getItem(ROUTE_PATH_KEY)
    if (!pathRaw) return null
    // The summary key is optional: the Simulator consumes it after import, but the persisted
    // path alone is enough to recompute exposure here under the active profile.
    const summaryRaw = localStorage.getItem(SIMULATOR_ROUTE_KEY)
    const summary = summaryRaw ? (JSON.parse(summaryRaw) as RouteSummary) : null
    const parsed = JSON.parse(pathRaw) as unknown
    // New format: { path, gridWidth, gridHeight }. Legacy format: a bare PathNode array
    // (assumed to index the full-resolution grid).
    if (Array.isArray(parsed)) {
      if (parsed.length === 0) return null
      return { path: parsed as PathNode[], gridWidth: null, gridHeight: null, summary }
    }
    const obj = parsed as { path?: PathNode[]; gridWidth?: number | null; gridHeight?: number | null }
    if (!Array.isArray(obj.path) || obj.path.length === 0) return null
    return {
      path: obj.path,
      gridWidth: typeof obj.gridWidth === 'number' ? obj.gridWidth : null,
      gridHeight: typeof obj.gridHeight === 'number' ? obj.gridHeight : null,
      summary,
    }
  } catch {
    return null
  }
}

function clampTileZoom(layerId: string, viewportZoom: number): number {
  const layer = getVerifiedLayer(layerId)
  const min = layer?.minZoom ?? 0
  const max = layer?.maxZoom ?? 18
  return Math.max(min, Math.min(max, viewportZoom))
}

/**
 * Terrain hazard intelligence workspace.
 *
 * Three-part layout: collapsible analysis controls, dominant map, and a right panel with
 * inventory / assessment / analytics tabs plus an explainable inspector. All scientific values
 * come from the verified hazard engines — nothing is recomputed or invented in the UI.
 */
export function HazardsPage() {
  const config = JEZERO_CONFIG
  const navigate = useNavigate()

  // View state
  const [center, setCenter] = useState(config.center)
  const [zoom, setZoom] = useState(config.defaultZoom)

  // Analysis state
  const [mode, setMode] = useState<HazardOverlayMode>('clusters')
  const [overlayOpacity, setOverlayOpacity] = useState(0.85)
  const [showClusters, setShowClusters] = useState(true)
  const [showRoute, setShowRoute] = useState(true)
  const [showRoverTrack, setShowRoverTrack] = useState(false)
  const [baseLayerId, setBaseLayerId] = useState(DEFAULT_BASE_LAYER)
  const [profile, setProfile] = useState<MobilityProfile>(() => getProfileById('standard'))

  // UI state
  const [leftOpen, setLeftOpen] = useState(false) // mobile drawer; lg: always visible
  const [rightTab, setRightTab] = useState<RightTab>('inventory')
  const [selectedClusterId, setSelectedClusterId] = useState<number | null>(null)
  const [clickedPoint, setClickedPoint] = useState<LatLon | null>(null)
  const [highlightedId, setHighlightedId] = useState<number | null>(null)
  const [highlightSeverity, setHighlightSeverity] = useState<Severity | null>(null)
  const [highlightCategory, setHighlightCategory] = useState<HazardCategory | null>(null)
  const [methodologyOpen, setMethodologyOpen] = useState(false)
  const [cursor, setCursor] = useState<LatLon | null>(null)
  const [importedRoute] = useState<StoredRoute | null>(() => readStoredRoute())
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const [mapSize, setMapSize] = useState({ width: 0, height: 0 })

  const baseLayer = useMemo(
    () => getVerifiedLayer(baseLayerId) ?? VERIFIED_GLOBAL_LAYERS[0],
    [baseLayerId],
  )
  const overlayLayer = useMemo(() => getVerifiedLayer(DEFAULT_OVERLAY_LAYER) ?? VERIFIED_REGIONAL_LAYERS[0], [])

  const effectiveZoom = useMemo(
    () => Math.max(config.minZoom, Math.min(config.maxZoom, zoom)),
    [config.maxZoom, config.minZoom, zoom],
  )
  const baseTileZoom = useMemo(
    () => clampTileZoom(baseLayer.id, effectiveZoom),
    [baseLayer.id, effectiveZoom],
  )
  const overlayTileZoom = useMemo(
    () => clampTileZoom(overlayLayer.id, effectiveZoom),
    [overlayLayer.id, effectiveZoom],
  )

  // Observe map container size
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
  }, [])

  // Visible tiles
  const baseVisibleTiles = useMemo(() => {
    if (mapSize.width === 0 || mapSize.height === 0) return []
    return computeVisibleTiles(center, baseTileZoom, mapSize)
  }, [center, baseTileZoom, mapSize])
  const overlayVisibleTiles = useMemo(() => {
    if (mapSize.width === 0 || mapSize.height === 0 || !overlayLayer) return []
    return computeVisibleTiles(center, overlayTileZoom, mapSize)
  }, [center, overlayTileZoom, mapSize, overlayLayer])

  const baseMosaic = useTileMosaic(baseLayer, baseVisibleTiles)
  const overlayMosaic = useTileMosaic(overlayLayer, overlayVisibleTiles)
  const roverTrack = useRoverTrack(config.roverTrackPath)

  // Terrain grid + analysis
  const terrainQuery = useTerrainGrid({
    metadataUrl: config.dem.metadataPath,
    heightmapUrl: config.dem.heightmapPath,
    slopeUrl: config.dem.slopePath,
  })

  const analysis = useMemo<TerrainAnalysis | null>(() => {
    if (!terrainQuery.data) return null
    return analyzeTerrain(terrainQuery.data, { windowRadius: 2 })
  }, [terrainQuery.data])

  const detection = useMemo(() => {
    if (!analysis) return null
    return detectHazards(analysis, profile)
  }, [analysis, profile])

  // Precompute accessibility for all profiles once per analysis (NOT per profile change).
  const allAccessibility = useMemo(() => {
    if (!analysis) return []
    return computeAllProfileAccessibility(analysis, MOBILITY_PROFILES)
  }, [analysis])
  const currentAccessibility = useMemo(
    () => allAccessibility.find((a) => a.profileId === profile.id) ?? null,
    [allAccessibility, profile.id],
  )

  // Route exposure — reuses the same analysis instance (no second ~600k-cell pass) and maps
  // path nodes through their own cost-grid extent so distances and samples are geographic.
  const routePathGrid = useMemo(() => {
    if (!importedRoute || !analysis) return null
    if (importedRoute.gridWidth && importedRoute.gridHeight) {
      return {
        width: importedRoute.gridWidth,
        height: importedRoute.gridHeight,
        bbox: analysis.bbox,
      }
    }
    return null
  }, [importedRoute, analysis])

  const routeExposure = useMemo<RouteExposureResult | null>(() => {
    if (!importedRoute || !terrainQuery.data || !analysis) return null
    return computeRouteExposure(
      importedRoute.path,
      terrainQuery.data,
      profile,
      detection?.clusters,
      analysis,
      routePathGrid ?? undefined,
    )
  }, [importedRoute, terrainQuery.data, analysis, profile, detection?.clusters, routePathGrid])

  // Route exists but exposure could not be computed (path outside DEM etc.).
  const routeImportFailed = importedRoute !== null && routeExposure === null

  // Terrain raster overlays (memoized; rebuilt only when the inputs change)
  const terrainOverlay = useMemo<MapOverlay | null>(() => {
    if (!analysis || !detection) return null
    switch (mode) {
      case 'slope':
        return buildSlopeOverlay(analysis)
      case 'roughness':
        return buildRoughnessOverlay(analysis)
      case 'relief':
        return buildReliefOverlay(analysis)
      case 'aspect':
        return buildAspectOverlay(analysis)
      case 'risk':
        return buildRiskOverlay(detection, analysis)
      case 'clusters':
      case 'none':
        return null
      default:
        return null
    }
  }, [analysis, detection, mode])

  const terrainLayerActive = terrainOverlay != null

  const overlays = useMemo(() => {
    if (!terrainOverlay) return []
    return [{ ...terrainOverlay, opacity: overlayOpacity }]
  }, [terrainOverlay, overlayOpacity])

  // Selected cluster object
  const selectedCluster = useMemo(() => {
    if (!detection || selectedClusterId == null) return null
    return detection.clusters.find((c) => c.id === selectedClusterId) ?? null
  }, [detection, selectedClusterId])

  // Clusters highlighted from analytics chart selection
  const analyticsHighlightIds = useMemo(() => {
    if (!detection) return []
    if (highlightSeverity)
      return detection.clusters.filter((c) => c.severity === highlightSeverity).map((c) => c.id)
    if (highlightCategory)
      return detection.clusters.filter((c) => c.category === highlightCategory).map((c) => c.id)
    return []
  }, [detection, highlightSeverity, highlightCategory])

  // Summary numbers for the header
  const totalAreaSqM = useMemo(() => {
    if (!analysis) return 0
    return analysis.width * analysis.height * analysis.metersPerPixel * analysis.metersPerPixel
  }, [analysis])
  const affectedAreaSqKm = useMemo(() => {
    if (!detection) return 0
    return detection.clusters.reduce((sum, c) => sum + c.areaSqM, 0) / 1_000_000
  }, [detection])
  const coveragePct = useMemo(() => {
    if (!analysis || !detection) return 0
    const total = analysis.width * analysis.height
    return (detection.validCellCount / total) * 100
  }, [analysis, detection])

  // Export payload (memoized; timestamp fixed at build time)
  const exportInput = useMemo<AnalysisExportInput | null>(() => {
    if (!analysis || !detection) return null
    return {
      meta: {
        region: config.name,
        demSource: 'USGS Mars 2020 TRN CTX DTM Mosaic (20 m/px)',
        demResolutionM: analysis.metersPerPixel,
        demBbox: analysis.bbox,
        windowRadius: analysis.windowRadius,
        generatedAtISO: new Date().toISOString(),
      },
      profile,
      detection,
      analysis,
      routeExposure,
      minClusterAreaSqM: 50_000,
    }
  }, [analysis, detection, profile, routeExposure, config.name])

  // Interactions
  const handleMapClick = useCallback((point: LatLon) => {
    setClickedPoint(point)
    setSelectedClusterId(null)
  }, [])

  const handleClusterSelect = useCallback((cluster: HazardCluster | null) => {
    if (!cluster) {
      setSelectedClusterId(null)
      return
    }
    setSelectedClusterId(cluster.id)
    setClickedPoint(null)
    // Center the cluster on the map (keep zoom).
    setCenter(cluster.centroid)
  }, [])

  const handleInventoryHover = useCallback((cluster: HazardCluster | null) => {
    setHighlightedId(cluster ? cluster.id : null)
  }, [])

  const handleReset = useCallback(() => {
    setCenter(config.center)
    setZoom(config.defaultZoom)
    setSelectedClusterId(null)
    setClickedPoint(null)
    setHighlightSeverity(null)
    setHighlightCategory(null)
    setHighlightedId(null)
  }, [config.center, config.defaultZoom])

  const sendToSimulator = useCallback(() => {
    if (!routeExposure || !importedRoute) return
    // Prefer the Planner-reported gain/loss; fall back to coarse per-segment elevation deltas
    // when the summary was consumed (e.g. the Simulator imported it earlier).
    let gain = importedRoute.summary?.elevationGainMeters ?? 0
    let loss = importedRoute.summary?.elevationLossMeters ?? 0
    if (importedRoute.summary == null) {
      for (let i = 1; i < routeExposure.segments.length; i++) {
        const delta =
          routeExposure.segments[i].elevationM - routeExposure.segments[i - 1].elevationM
        if (Number.isFinite(delta)) {
          if (delta > 0) gain += delta
          else loss += -delta
        }
      }
    }
    const summary: RouteSummary = {
      distanceMeters: Math.round(routeExposure.totalDistanceM),
      elevationGainMeters: gain,
      elevationLossMeters: loss,
      maxSlopeDegrees: Number(routeExposure.maxSlopeDeg.toFixed(2)),
      averageSlopeDegrees: Number(routeExposure.meanSlopeDeg.toFixed(2)),
      ...(importedRoute.summary?.totalEnergyKJ != null
        ? { totalEnergyKJ: importedRoute.summary.totalEnergyKJ }
        : {}),
    }
    localStorage.setItem(SIMULATOR_ROUTE_KEY, JSON.stringify(summary))
    navigate('/simulator')
  }, [routeExposure, importedRoute, navigate])

  const planRouteNearCluster = useCallback(
    (cluster: HazardCluster | null) => {
      if (!cluster) return
      const { lat, lon } = cluster.centroid
      navigate(`/planner?startLat=${lat.toFixed(5)}&startLon=${lon.toFixed(5)}`)
    },
    [navigate],
  )

  const handleGoToPlanner = useCallback(() => navigate('/planner'), [navigate])

  // Inspect mode: a cluster or clicked point takes over the right panel.
  const inspectMode = selectedCluster !== null || clickedPoint !== null
  const previousTabRef = useRef<RightTab>('inventory')
  useEffect(() => {
    if (!inspectMode) return
    previousTabRef.current = rightTab === 'route' ? 'inventory' : rightTab
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inspectMode])

  const backToInventory = useCallback(() => {
    setRightTab(previousTabRef.current)
    setSelectedClusterId(null)
    setClickedPoint(null)
  }, [])

  // Clicked point sample for the inspector
  const clickedSample = useMemo(() => {
    if (!clickedPoint || !analysis) return null
    // sampleAnalysis returns null outside the DEM bbox; keep the point so the inspector can
    // still show coordinates and an honest "no coverage" note.
    const idx = (() => {
      const { bbox, width, height } = analysis
      if (
        clickedPoint.lon < bbox.west ||
        clickedPoint.lon > bbox.east ||
        clickedPoint.lat < bbox.south ||
        clickedPoint.lat > bbox.north
      ) {
        return null
      }
      const x = Math.round(((clickedPoint.lon - bbox.west) / (bbox.east - bbox.west)) * (width - 1))
      const y = Math.round(((bbox.north - clickedPoint.lat) / (bbox.north - bbox.south)) * (height - 1))
      const i = y * width + x
      return i >= 0 && i < width * height ? i : null
    })()
    if (!idx) {
      return {
        elevation: Number.NaN,
        slope: Number.NaN,
        tri: Number.NaN,
        roughness: Number.NaN,
        relief: Number.NaN,
        aspect: -1,
        valid: false,
      }
    }
    const risk = assessCellRisk(
      analysis.slope[idx],
      analysis.roughness[idx],
      analysis.relief[idx],
      analysis.valid[idx] === 1,
      profile,
    )
    return {
      elevation: analysis.elevation[idx],
      slope: analysis.slope[idx],
      tri: analysis.tri[idx],
      roughness: analysis.roughness[idx],
      relief: analysis.relief[idx],
      aspect: analysis.aspect[idx],
      valid: risk.severity !== 'unknown',
    }
  }, [clickedPoint, analysis, profile])

  // Tile status
  const totalFailed =
    (baseMosaic.query.data?.tilesFailed ?? 0) + (overlayMosaic.query.data?.tilesFailed ?? 0)
  const totalLoaded =
    (baseMosaic.query.data?.tilesTotal ?? 0) + (overlayMosaic.query.data?.tilesTotal ?? 0)
  const loadedCount = totalFailed > 0 ? totalLoaded - totalFailed : totalLoaded

  const TABS: Array<{ id: RightTab; label: string; icon: typeof MapIcon }> = [
    { id: 'inventory', label: 'Inventory', icon: ClipboardList },
    { id: 'assessment', label: 'Assessment', icon: SlidersHorizontal },
    { id: 'analytics', label: 'Analytics', icon: ChartColumn },
    { id: 'route', label: 'Route', icon: Route },
  ]

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col overflow-hidden bg-space">
      <WorkspaceHeader
        detection={detection}
        coveragePct={coveragePct}
        affectedAreaSqKm={affectedAreaSqKm}
        profile={profile}
        analysisBusy={terrainQuery.isLoading}
        onReset={handleReset}
        onOpenMethodology={() => setMethodologyOpen(true)}
        exportInput={exportInput}
        tileFailures={totalFailed}
      />

      <div className="relative flex flex-1 overflow-hidden">
        {/* Left analysis controls (collapsible; drawer on small screens) */}
        <AnalysisPanel
          mode={mode}
          onModeChange={setMode}
          overlayOpacity={overlayOpacity}
          onOverlayOpacityChange={setOverlayOpacity}
          showClusters={showClusters}
          onShowClustersChange={setShowClusters}
          showRoute={showRoute}
          onShowRouteChange={setShowRoute}
          showRoverTrack={showRoverTrack}
          onShowRoverTrackChange={setShowRoverTrack}
          baseLayerId={baseLayerId}
          onBaseLayerChange={setBaseLayerId}
          profile={profile}
          onProfileChange={setProfile}
          clusterCount={detection?.clusters.length ?? null}
          isOpen={leftOpen}
          onClose={() => setLeftOpen(false)}
        />

        {/* Dominant map */}
        <div ref={mapContainerRef} className="relative flex-1 overflow-hidden bg-space">
          {/* Mobile panel toggles */}
          <button
            type="button"
            onClick={() => setLeftOpen(true)}
            className="absolute left-3 top-3 z-40 flex items-center gap-1.5 rounded-lg border border-line bg-space/90 px-2.5 py-1.5 text-xs text-ink shadow-panel backdrop-blur-md transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70 lg:hidden"
            aria-label="Open analysis controls"
          >
            <PanelLeft className="size-3.5 text-cyan" aria-hidden="true" />
            Controls
          </button>

          {terrainQuery.isLoading ? (
            <div className="flex h-full items-center justify-center font-mono text-xs text-ink-dim">
              Loading terrain grid…
            </div>
          ) : terrainQuery.error ? (
            <TerrainLoadError error={terrainQuery.error} />
          ) : (
            <>
              <MapCanvas
                config={config}
                zoom={effectiveZoom}
                center={center}
                onCenterChange={setCenter}
                onZoomChange={setZoom}
                onCursor={setCursor}
                onClick={handleMapClick}
                baseMosaic={baseMosaic}
                baseTileZoom={baseTileZoom}
                overlayMosaic={overlayMosaic}
                overlayTileZoom={overlayTileZoom}
                overlayOpacity={1}
                overlays={overlays}
              />

              {detection ? (
                <ClusterOverlay
                  clusters={detection.clusters}
                  selectedId={selectedClusterId}
                  highlightedIds={[
                    ...(highlightedId !== null ? [highlightedId] : []),
                    ...analyticsHighlightIds,
                  ]}
                  onSelect={handleClusterSelect}
                  onHover={handleInventoryHover}
                  center={center}
                  zoom={effectiveZoom}
                  size={mapSize}
                  visible={showClusters}
                />
              ) : null}

              {routeExposure ? (
                <RouteOverlay
                  exposure={routeExposure}
                  center={center}
                  zoom={effectiveZoom}
                  size={mapSize}
                  visible={showRoute}
                />
              ) : null}

              {roverTrack.data ? (
                <RoverTrackOverlay
                  waypoints={roverTrack.data.waypoints}
                  center={center}
                  zoom={effectiveZoom}
                  size={mapSize}
                  visible={showRoverTrack}
                />
              ) : null}

              <CursorTooltip
                cursor={cursor}
                center={center}
                zoom={effectiveZoom}
                size={mapSize}
                analysis={analysis}
                profile={profile}
              />

              {/* Selected cluster pointer marker */}
              {selectedCluster ? (
                <SelectedMarker
                  point={selectedCluster.centroid}
                  center={center}
                  zoom={effectiveZoom}
                  size={mapSize}
                  color={SEVERITY_COLORS[selectedCluster.severity]}
                />
              ) : null}

              {/* Scale bar */}
              <div className="pointer-events-none absolute bottom-3 left-4 z-30">
                <ScaleBar zoom={effectiveZoom} latitude={center.lat} />
              </div>
            </>
          )}
        </div>

        {/* Right panel: inspector mode or tabs */}
        <aside
          className="absolute right-0 top-0 z-30 flex h-full w-[320px] max-w-full flex-col border-l border-line bg-space/95 shadow-panel backdrop-blur-md transition-transform lg:static lg:z-auto lg:translate-x-0"
          aria-label="Hazard intelligence panel"
        >
          {inspectMode ? (
            /* Inspector replaces tabs while something is selected */
            <div className="flex h-full flex-col">
              <HazardInspector
                cluster={selectedCluster}
                point={clickedPoint}
                pointSample={clickedSample}
                profile={profile}
                onBack={backToInventory}
                onPlanRoute={planRouteNearCluster}
              />
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex border-b border-line">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setRightTab(tab.id)}
                    aria-selected={rightTab === tab.id}
                    role="tab"
                    className={cn(
                      'flex flex-1 items-center justify-center gap-1 border-b-2 py-2.5 text-[10px] font-medium uppercase tracking-wider transition-colors',
                      rightTab === tab.id
                        ? 'border-cyan text-cyan'
                        : 'border-transparent text-ink-dim hover:text-ink',
                    )}
                  >
                    <tab.icon className="size-3.5" aria-hidden="true" />
                    <span className="hidden xl:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto">
                {rightTab === 'inventory' ? (
                  detection ? (
                    <HazardInventory
                      detection={detection}
                      totalAreaSqKm={totalAreaSqM / 1_000_000}
                      selectedId={selectedClusterId}
                      onSelect={handleClusterSelect}
                      onHover={handleInventoryHover}
                    />
                  ) : (
                    <EmptyState
                      text={
                        terrainQuery.isLoading
                          ? 'Loading terrain grid…'
                          : 'Terrain grid could not be loaded — see the map panel for details.'
                      }
                    />
                  )
                ) : null}

                {rightTab === 'assessment' ? (
                  detection && analysis ? (
                    <AssessmentPanel
                      detection={detection}
                      analysis={analysis}
                      totalAreaSqM={totalAreaSqM}
                      currentAccessibility={currentAccessibility}
                      allAccessibility={allAccessibility}
                    />
                  ) : (
                    <EmptyState text="Assessment is available once the terrain grid is loaded." />
                  )
                ) : null}

                {rightTab === 'analytics' ? (
                  detection ? (
                    <AnalyticsPanel
                      detection={detection}
                      highlightSeverity={highlightSeverity}
                      highlightCategory={highlightCategory}
                      onHighlightSeverity={setHighlightSeverity}
                      onHighlightCategory={setHighlightCategory}
                    />
                  ) : (
                    <EmptyState text="Analytics are available once the terrain grid is loaded." />
                  )
                ) : null}

                {rightTab === 'route' ? (
                  <div className="h-full">
                    <RouteExposurePanel
                      exposure={routeExposure}
                      importFailed={routeImportFailed}
                      routeDistanceMeters={importedRoute?.summary?.distanceMeters ?? null}
                      clusters={detection?.clusters ?? []}
                      selectedClusterId={selectedClusterId}
                      onSelectCluster={handleClusterSelect}
                      onGoToPlanner={handleGoToPlanner}
                      onSendToSimulator={sendToSimulator}
                    />
                  </div>
                ) : null}
              </div>
            </>
          )}
        </aside>
      </div>

      {/* Bottom coordinate bar */}
      <CoordinateBar
        cursor={cursor}
        center={center}
        zoom={effectiveZoom}
        activeLayerName={
          terrainLayerActive
            ? (OVERLAY_MODES.find((m) => m.id === mode)?.label ?? mode)
            : baseLayer.title
        }
        tileStatus={{
          loaded: loadedCount,
          total: totalLoaded,
          failed: totalFailed,
        }}
      />

      <MethodologyDialog open={methodologyOpen} onOpenChange={setMethodologyOpen} />
    </div>
  )
}

/** Cluster centroid pointer marker (selected cluster). */
function SelectedMarker({
  point,
  center,
  zoom,
  size,
  color,
}: {
  point: LatLon
  center: LatLon
  zoom: number
  size: { width: number; height: number }
  color: string
}) {
  const px = useMemo(
    () => (size.width > 0 ? latLonToPixel(point, center, zoom, size) : null),
    [point, center, zoom, size],
  )
  if (!px) return null
  return (
    <svg className="pointer-events-none absolute inset-0 z-40" width={size.width} height={size.height}>
      <circle cx={px.x} cy={px.y} r={7} fill="none" stroke={color} strokeWidth={2} />
      <circle cx={px.x} cy={px.y} r={2.5} fill={color} />
    </svg>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex h-full items-center justify-center p-4 text-center">
      <p className="text-xs leading-relaxed text-ink-dim">{text}</p>
    </div>
  )
}
