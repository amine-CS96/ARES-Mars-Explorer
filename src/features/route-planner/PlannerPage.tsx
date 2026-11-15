import { useEffect, useMemo, useRef, useState } from 'react'
import { MapPinned, RotateCcw, Send } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  JEZERO_CONFIG,
  TerrainLoadError,
} from '@/features/mars-explorer'
import { useTerrainGrid } from '@/hooks/useTerrainGrid'
import { formatLatLon } from '@/utils/geo'
import { SLOPE_CLASS_COLORS, slopeClass } from '@/engines/terrain/slopeClass'
import { SIMULATOR_ROUTE_KEY, type RouteSummary } from '@/engines/simulation/missionConfig'
import type { LatLon } from '@/types/geo'
import { RouteMap } from './RouteMap'
import { RouteStats } from './RouteStats'
import { ElevationProfile } from './ElevationProfile'
import { useRoutePlanner, defaultCostParams } from './useRoutePlanner'

/**
 * Module F — Marswalk Route Planner.
 *
 * Users click a start and destination on the real Jezero terrain. ARES runs A* over the DEM cost
 * grid using a Pandolf-derived metabolic-energy cost model and displays the recommended route,
 * an alternative, straight-line comparison, stats, and an elevation profile.
 */

/** Pre-defined sample route inside the DEM: Octavia E. Butler Landing → Three Forks Sample Depot. */
const SAMPLE_START: LatLon = { lat: 18.4447, lon: 77.4508 }
const SAMPLE_GOAL: LatLon = { lat: 18.4528, lon: 77.4082 }

function parseLatLonParam(params: URLSearchParams, latKey: string, lonKey: string): LatLon | null {
  const lat = Number.parseFloat(params.get(latKey) ?? '')
  const lon = Number.parseFloat(params.get(lonKey) ?? '')
  if (Number.isFinite(lat) && Number.isFinite(lon)) return { lat, lon }
  return null
}

export function PlannerPage() {
  const config = JEZERO_CONFIG
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [center, setCenter] = useState(config.center)
  const [zoom, setZoom] = useState(config.defaultZoom)
  const [cursor, setCursor] = useState<LatLon | null>(null)
  const [start, setStart] = useState<LatLon | null>(() =>
    parseLatLonParam(searchParams, 'startLat', 'startLon'),
  )
  const [goal, setGoal] = useState<LatLon | null>(() =>
    parseLatLonParam(searchParams, 'goalLat', 'goalLon'),
  )

  const [maxSlopeDeg, setMaxSlopeDeg] = useState(20)
  const [allowDangerous, setAllowDangerous] = useState(false)
  const [gridCells, setGridCells] = useState(256)
  const [costParams, setCostParams] = useState(defaultCostParams())

  const routeState = useRoutePlanner(config.dem, start, goal, {
    maxSlopeDeg,
    allowDangerous,
    costParams,
    gridCells,
  })

  const terrainQuery = useTerrainGrid({
    metadataUrl: config.dem.metadataPath,
    heightmapUrl: config.dem.heightmapPath,
    slopeUrl: config.dem.slopePath,
  })

  // Persist every computed route (path + summary) so the Hazards and Simulator modules can
  // pick it up. Previously the path was only stored when explicitly sending to the Simulator,
  // which broke the Planner → Hazards route-exposure handoff. The path grid dimensions are
  // stored too: path nodes index the cost grid, not the full-resolution DEM.
  const persistedRouteKeyRef = useRef('')
  useEffect(() => {
    const result = routeState.primary
    const summary = routeState.primarySummary
    if (!result || !result.reachable || !summary || summary.path.length < 2) {
      persistedRouteKeyRef.current = ''
      return
    }
    const path = summary.path
    const routeKey = `${path.length}:${path[0].x},${path[0].y}->${path[path.length - 1].x},${path[path.length - 1].y}`
    if (persistedRouteKeyRef.current === routeKey) return
    persistedRouteKeyRef.current = routeKey

    // Enrich the summary with measured elevation gain/loss from the full-resolution grid.
    let gain = 0
    let loss = 0
    const grid = routeState.terrainGrid
    if (grid) {
      for (let i = 1; i < path.length; i++) {
        const delta =
          grid.elevation[path[i].y * grid.width + path[i].x] -
          grid.elevation[path[i - 1].y * grid.width + path[i - 1].x]
        if (delta > 0) gain += delta
        else loss += -delta
      }
    }
    const persistable: RouteSummary = {
      distanceMeters: summary.distanceMeters,
      elevationGainMeters: gain,
      elevationLossMeters: loss,
      maxSlopeDegrees: summary.maxSlopeDeg,
      averageSlopeDegrees: summary.averageSlopeDeg,
      totalEnergyKJ: summary.cost / 1000,
    }
    localStorage.setItem(SIMULATOR_ROUTE_KEY, JSON.stringify(persistable))
    localStorage.setItem(
      'ares:planner-route-path',
      JSON.stringify({
        path,
        gridWidth: routeState.costGrid?.width ?? null,
        gridHeight: routeState.costGrid?.height ?? null,
      }),
    )
  }, [routeState.primary, routeState.primarySummary, routeState.terrainGrid, routeState.costGrid])

  const cursorSample = useMemo(() => {
    if (!cursor || !terrainQuery.data) return null
    const idx =
      cursor.lon >= terrainQuery.data.bbox.west &&
      cursor.lon <= terrainQuery.data.bbox.east &&
      cursor.lat >= terrainQuery.data.bbox.south &&
      cursor.lat <= terrainQuery.data.bbox.north
        ? {
            x: Math.round(
              ((cursor.lon - terrainQuery.data.bbox.west) /
                (terrainQuery.data.bbox.east - terrainQuery.data.bbox.west)) *
                (terrainQuery.data.width - 1),
            ),
            y: Math.round(
              ((terrainQuery.data.bbox.north - cursor.lat) /
                (terrainQuery.data.bbox.north - terrainQuery.data.bbox.south)) *
                (terrainQuery.data.height - 1),
            ),
          }
        : null
    if (!idx) return null
    const i = idx.y * terrainQuery.data.width + idx.x
    return {
      elevationM: terrainQuery.data.elevation[i],
      slopeDeg: terrainQuery.data.slope[i],
      elevationKind: 'measured' as const,
      slopeKind: 'derived' as const,
    }
  }, [cursor, terrainQuery.data])

  const clampPoint = (p: LatLon): LatLon => ({
    lat: Math.max(config.bbox.south, Math.min(config.bbox.north, p.lat)),
    lon: Math.max(config.bbox.west, Math.min(config.bbox.east, p.lon)),
  })

  const handleMapClick = (point: LatLon) => {
    const clamped = clampPoint(point)
    if (!start) {
      setStart(clamped)
    } else if (!goal) {
      setGoal(clamped)
    }
  }

  const reset = () => {
    setStart(null)
    setGoal(null)
    // Clear the persisted handoff so Hazards/Simulator do not show a stale route.
    localStorage.removeItem('ares:planner-route-path')
    localStorage.removeItem(SIMULATOR_ROUTE_KEY)
  }

  const sendToSimulator = () => {
    if (!routeState.primarySummary) return
    const summary: RouteSummary = {
      distanceMeters: routeState.primarySummary.distanceMeters,
      elevationGainMeters: 0,
      elevationLossMeters: 0,
      maxSlopeDegrees: routeState.primarySummary.maxSlopeDeg,
      averageSlopeDegrees: routeState.primarySummary.averageSlopeDeg,
      totalEnergyKJ: routeState.primarySummary.cost / 1000,
    }
    // Approximate gain/loss from the path if terrain grid is available.
    if (routeState.primary?.path && routeState.terrainGrid) {
      let gain = 0
      let loss = 0
      const grid = routeState.terrainGrid
      for (let i = 1; i < routeState.primary.path.length; i++) {
        const prev = routeState.primary.path[i - 1]
        const curr = routeState.primary.path[i]
        const prevElev = grid.elevation[prev.y * grid.width + prev.x]
        const currElev = grid.elevation[curr.y * grid.width + curr.x]
        const delta = currElev - prevElev
        if (delta > 0) gain += delta
        else loss += -delta
      }
      summary.elevationGainMeters = gain
      summary.elevationLossMeters = loss
    }
    localStorage.setItem(SIMULATOR_ROUTE_KEY, JSON.stringify(summary))
    // Also persist the path nodes (with their cost-grid dimensions) so the Hazards module can
    // compute route exposure at the correct geographic positions.
    if (routeState.primary?.path) {
      localStorage.setItem(
        'ares:planner-route-path',
        JSON.stringify({
          path: routeState.primary.path,
          gridWidth: routeState.costGrid?.width ?? null,
          gridHeight: routeState.costGrid?.height ?? null,
        }),
      )
    }
    navigate('/simulator')
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="animate-fade-up">
        <p className="eyebrow mb-2">Route planning</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-bold tracking-wide text-ink sm:text-4xl">
            Marswalk Route Planner
          </h1>
          <span className="rounded border border-success/40 bg-success/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-success">
            A* on real DEM
          </span>
          <span className="rounded border border-cyan/40 bg-cyan/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-cyan">
            Energy cost model
          </span>
        </div>
        <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-ink-dim">
          Click twice on the map to set a start (green) and destination (orange), or load the
          sample route. ARES computes a path over the Jezero CTX 20 m DEM that minimizes estimated
          metabolic energy while respecting your slope limit.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        {/* Map */}
        <div className="relative h-[540px] overflow-hidden rounded-xl border border-line bg-surface shadow-panel sm:h-[600px] lg:h-[660px]">
          {terrainQuery.isLoading ? (
            <div className="flex h-full items-center justify-center font-mono text-xs text-ink-dim">
              Loading terrain grid…
            </div>
          ) : terrainQuery.error ? (
            <TerrainLoadError error={terrainQuery.error} />
          ) : (
            <RouteMap
              center={center}
              zoom={zoom}
              onCenterChange={setCenter}
              onZoomChange={setZoom}
              onMapClick={handleMapClick}
              start={start}
              goal={goal}
              primaryPath={routeState.primary?.path ?? null}
              alternativePath={routeState.alternative?.path ?? null}
              costGrid={routeState.costGrid}
              cursor={cursor}
              onCursor={setCursor}
            />
          )}
        </div>

        {/* Controls + stats */}
        <div className="space-y-4">
          <div className="rounded-xl border border-line bg-surface/50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-sm font-semibold tracking-wide text-ink">
                Route controls
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStart(SAMPLE_START)
                    setGoal(SAMPLE_GOAL)
                    setCenter({
                      lat: (SAMPLE_START.lat + SAMPLE_GOAL.lat) / 2,
                      lon: (SAMPLE_START.lon + SAMPLE_GOAL.lon) / 2,
                    })
                  }}
                  className="h-7 gap-1 border-line bg-space/50 px-2 text-[10px] text-cyan hover:text-cyan"
                >
                  <MapPinned className="size-3" aria-hidden="true" />
                  Sample route
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={reset}
                  className="h-7 gap-1 border-line bg-space/50 px-2 text-[10px] text-ink-dim hover:text-ink"
                >
                  <RotateCcw className="size-3" aria-hidden="true" />
                  Reset
                </Button>
              </div>
            </div>

            {!start && !goal ? (
              <div className="mb-3 rounded-lg border border-accent/25 bg-accent/[0.06] p-3">
                <p className="text-xs leading-relaxed text-ink-dim">
                  Click the map twice to set a start and destination, or load the sample route across
                  Perseverance's neighborhood.
                </p>
              </div>
            ) : null}

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[9px] uppercase tracking-wider text-ink-faint">
                    Max slope
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={5}
                      max={35}
                      step={1}
                      value={maxSlopeDeg}
                      onChange={(e) => setMaxSlopeDeg(Number.parseInt(e.target.value, 10))}
                      className="h-1 w-full cursor-pointer appearance-none rounded bg-surface-2 accent-cyan"
                    />
                    <span className="w-10 font-mono text-[10px] text-ink">{maxSlopeDeg}°</span>
                  </div>
                </div>
                <div>
                  <label className="block font-mono text-[9px] uppercase tracking-wider text-ink-faint">
                    Routing grid
                  </label>
                  <select
                    value={gridCells}
                    onChange={(e) => setGridCells(Number.parseInt(e.target.value, 10))}
                    className="mt-1 w-full rounded border border-line bg-space px-2 py-1 font-mono text-[10px] text-ink"
                  >
                    <option value={128}>128 × 128 (fast)</option>
                    <option value={256}>256 × 256 (balanced)</option>
                    <option value={384}>384 × 384 (fine)</option>
                  </select>
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={allowDangerous}
                  onChange={(e) => setAllowDangerous(e.target.checked)}
                  className="size-3 accent-cyan"
                />
                <span className="font-mono text-[10px] text-ink-dim">
                  Allow routing through hazardous cells (flagged)
                </span>
              </label>

              <details className="group">
                <summary className="cursor-pointer font-mono text-[10px] text-cyan/90 hover:text-cyan">
                  Cost-model assumptions
                </summary>
                <div className="mt-2 space-y-2 rounded border border-line bg-space/50 p-2">
                  <ParamInput
                    label="Body mass"
                    value={costParams.bodyMassKg}
                    suffix="kg"
                    min={40}
                    max={150}
                    step={1}
                    onChange={(v) => setCostParams((p) => ({ ...p, bodyMassKg: v }))}
                  />
                  <ParamInput
                    label="Load mass"
                    value={costParams.loadMassKg}
                    suffix="kg"
                    min={0}
                    max={100}
                    step={1}
                    onChange={(v) => setCostParams((p) => ({ ...p, loadMassKg: v }))}
                  />
                  <ParamInput
                    label="Speed"
                    value={costParams.speedMps}
                    suffix="m/s"
                    min={0.3}
                    max={2}
                    step={0.1}
                    onChange={(v) => setCostParams((p) => ({ ...p, speedMps: v }))}
                  />
                  <ParamInput
                    label="Suit penalty"
                    value={costParams.suitPenalty}
                    suffix="×"
                    min={1}
                    max={3}
                    step={0.1}
                    onChange={(v) => setCostParams((p) => ({ ...p, suitPenalty: v }))}
                  />
                  <ParamInput
                    label="Terrain factor"
                    value={costParams.terrainFactor}
                    suffix="×"
                    min={1}
                    max={3}
                    step={0.1}
                    onChange={(v) => setCostParams((p) => ({ ...p, terrainFactor: v }))}
                  />
                </div>
              </details>
            </div>
          </div>

          <RouteStats routeState={routeState} />

          {routeState.primarySummary ? (
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={sendToSimulator}
              className="w-full gap-2"
            >
              <Send className="size-4" aria-hidden="true" />
              Send to Marswalk simulator
            </Button>
          ) : null}

          {routeState.primarySummary ? (
            <ElevationProfile
              path={routeState.primary?.path ?? null}
              terrainGrid={routeState.terrainGrid}
            />
          ) : null}

          {/* Cursor readout */}
          <div className="rounded-xl border border-line bg-surface/50 p-3">
            <p className="font-mono text-[10px] text-cyan/90">
              {cursor ? formatLatLon(cursor, { decimals: 4 }) : 'Cursor — hover the map'}
            </p>
            {cursorSample ? (
              <div className="mt-1 flex flex-wrap items-center gap-3 font-mono text-[10px] text-ink">
                <span>Elev {cursorSample.elevationM.toFixed(1)} m</span>
                <span className="flex items-center gap-1">
                  Slope {cursorSample.slopeDeg.toFixed(1)}°
                  <span
                    aria-hidden="true"
                    className="inline-block size-2 rounded-full"
                    style={{
                      backgroundColor: SLOPE_CLASS_COLORS[slopeClass(cursorSample.slopeDeg).key],
                    }}
                  />
                  {slopeClass(cursorSample.slopeDeg).label}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <footer className="mt-8 space-y-1.5 rounded-xl border border-line bg-surface/50 p-4 text-[11px] leading-relaxed text-ink-faint">
        <p>
          <span className="font-mono uppercase tracking-wider text-cyan/90">Data</span> — route is
          computed on the USGS Mars 2020 TRN CTX DTM Mosaic (20 m/px). Slope classes are derived
          from the DEM. Coverage is limited to the Jezero CTX DTM bbox.
        </p>
        <p>
          <span className="font-mono uppercase tracking-wider text-cyan/90">Model</span> — A* with
          8-connected moves; edge cost = Pandolf-derived metabolic energy (Mars gravity + suit
          penalty). Outputs are planning estimates, not certified traversability or life-support
          decisions.
        </p>
      </footer>
    </div>
  )
}

function ParamInput({
  label,
  value,
  suffix,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  suffix: string
  min: number
  max: number
  step: number
  onChange: (value: number) => void
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <label className="font-mono text-[9px] text-ink-dim">{label}</label>
      <div className="flex items-center gap-1">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number.parseFloat(e.target.value))}
          className="w-16 rounded border border-line bg-space px-1 py-0.5 text-right font-mono text-[10px] text-ink"
        />
        <span className="w-6 font-mono text-[9px] text-ink-faint">{suffix}</span>
      </div>
    </div>
  )
}
