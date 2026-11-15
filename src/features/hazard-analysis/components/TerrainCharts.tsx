import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { HazardDetectionResult } from '@/engines/hazards/hazardDetection'
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  SEVERITY_COLORS,
  SEVERITY_LABELS,
  type HazardCategory,
  type Severity,
} from '@/engines/hazards/riskModel'

interface TerrainChartsProps {
  result: HazardDetectionResult
}

export function TerrainCharts({ result }: TerrainChartsProps) {
  const severityData = (['critical', 'high', 'moderate', 'low', 'unknown'] as Severity[])
    .filter((s) => result.severityCounts[s] > 0)
    .map((s) => ({
      name: SEVERITY_LABELS[s],
      value: result.severityCounts[s],
      color: SEVERITY_COLORS[s],
    }))

  const categoryData = (
    Object.keys(result.categoryCounts).filter((c) => c !== 'none') as HazardCategory[]
  )
    .filter((c) => result.categoryCounts[c] > 0)
    .map((c) => ({
      name: CATEGORY_LABELS[c],
      value: result.categoryCounts[c],
      color: CATEGORY_COLORS[c],
    }))

  return (
    <div className="space-y-5 p-4">
      <div>
        <h3 className="font-display text-sm font-semibold tracking-wide text-ink">
          Severity distribution
        </h3>
        <div className="mt-2 h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={severityData} margin={{ top: 8, right: 8, bottom: 8, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#232c3f" />
              <XAxis dataKey="name" tick={{ fill: '#6b7a94', fontSize: 10 }} stroke="#232c3f" />
              <YAxis tick={{ fill: '#6b7a94', fontSize: 10 }} stroke="#232c3f" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111722',
                  border: '1px solid #232c3f',
                  borderRadius: '8px',
                  fontSize: '11px',
                }}
                itemStyle={{ color: '#f5f7fa' }}
                labelStyle={{ color: '#9aa7bd' }}
              />
              <Bar dataKey="value" name="Cells">
                {severityData.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h3 className="font-display text-sm font-semibold tracking-wide text-ink">
          Hazard category breakdown
        </h3>
        <div className="mt-2 h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={55}
                stroke="#111722"
                strokeWidth={2}
              >
                {categoryData.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111722',
                  border: '1px solid #232c3f',
                  borderRadius: '8px',
                  fontSize: '11px',
                }}
                itemStyle={{ color: '#f5f7fa' }}
                labelStyle={{ color: '#9aa7bd' }}
              />
              <Legend
                verticalAlign="bottom"
                height={24}
                iconType="circle"
                wrapperStyle={{ fontSize: '10px', color: '#9aa7bd' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
