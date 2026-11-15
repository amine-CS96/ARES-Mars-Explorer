import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { gridIndexToLatLon, type TerrainGrid } from '@/engines/terrain/terrainGrid'
import type { PathNode } from '@/engines/pathfinding/astar'
import { haversineDistanceKm } from '@/utils/geo'

interface ElevationProfileProps {
  path: PathNode[] | null
  terrainGrid: TerrainGrid | null
}

interface ProfilePoint {
  distanceKm: number
  elevationM: number
  slopeDeg: number
}

export function ElevationProfile({ path, terrainGrid }: ElevationProfileProps) {
  if (!path || path.length === 0 || !terrainGrid) return null

  const data: ProfilePoint[] = []
  let distanceKm = 0
  let prev: { lat: number; lon: number } | null = null

  // Sample every Nth cell to keep the chart responsive on long routes.
  const step = Math.max(1, Math.floor(path.length / 120))
  for (let i = 0; i < path.length; i += step) {
    const node = path[i]
    const latLon = gridIndexToLatLon(terrainGrid, node.x, node.y)
    if (prev) distanceKm += haversineDistanceKm(prev, latLon)
    const idx = node.y * terrainGrid.width + node.x
    data.push({
      distanceKm,
      elevationM: terrainGrid.elevation[idx],
      slopeDeg: terrainGrid.slope[idx],
    })
    prev = latLon
  }

  return (
    <div className="space-y-2 rounded-xl border border-line bg-surface/50 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold tracking-wide text-ink">Elevation profile</h3>
        <span className="font-mono text-[9px] uppercase tracking-wider text-ink-faint">
          Elevation (m) · Slope (°)
        </span>
      </div>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
            <defs>
              <linearGradient id="elevGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#53d6e8" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#53d6e8" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#232c3f" />
            <XAxis
              dataKey="distanceKm"
              tick={{ fill: '#6b7a94', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
              tickFormatter={(v: number) => `${v.toFixed(1)}`}
              stroke="#232c3f"
              label={{ value: 'Distance (km)', position: 'insideBottom', fill: '#6b7a94', fontSize: 10 }}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: '#6b7a94', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
              stroke="#232c3f"
              label={{ value: 'm', angle: -90, position: 'insideLeft', fill: '#6b7a94', fontSize: 10 }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: '#6b7a94', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
              stroke="#232c3f"
              label={{ value: '°', angle: 90, position: 'insideRight', fill: '#6b7a94', fontSize: 10 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#111722',
                border: '1px solid #232c3f',
                borderRadius: '8px',
                fontSize: '11px',
              }}
              itemStyle={{ color: '#f5f7fa' }}
              labelStyle={{ color: '#9aa7bd' }}
              formatter={(value, name) => {
                const v = typeof value === 'number' ? value : Number(value)
                if (Number.isNaN(v) || name === undefined) return ['—', '']
                if (name === 'Elevation') return [`${v.toFixed(1)} m`, String(name)]
                return [`${v.toFixed(1)}°`, String(name)]
              }}
              labelFormatter={(label) => `Distance: ${typeof label === 'number' ? label.toFixed(2) : label} km`}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="elevationM"
              name="Elevation"
              stroke="#53d6e8"
              fill="url(#elevGradient)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#53d6e8' }}
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="slopeDeg"
              name="Slope"
              stroke="#fbbf24"
              fill="none"
              strokeWidth={1.5}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="font-mono text-[9px] leading-relaxed text-ink-faint">
        Elevation is measured relative to the MOLA areoid. Slope is the derived value from the
        pipeline slope map.
      </p>
    </div>
  )
}
