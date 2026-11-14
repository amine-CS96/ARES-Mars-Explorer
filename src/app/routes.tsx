import { lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { NotFoundPage } from './NotFoundPage'
import { PageFallback } from './PageFallback'

/*
 * Feature pages are lazy — heavy modules (3D globe in Phase 2, terrain in Phase 3) must never
 * land in the initial bundle. Dashboard stays eager for first paint.
 */
const GlobePage = lazy(() =>
  import('@/features/globe/GlobePage').then((m) => ({ default: m.GlobePage })),
)
const ExplorerPage = lazy(() =>
  import('@/features/mars-explorer/ExplorerPage').then((m) => ({ default: m.ExplorerPage })),
)
const AtlasPage = lazy(() =>
  import('@/features/points-of-interest/AtlasPage').then((m) => ({ default: m.AtlasPage })),
)
const HazardsPage = lazy(() =>
  import('@/features/hazard-analysis/HazardsPage').then((m) => ({ default: m.HazardsPage })),
)
const PlannerPage = lazy(() =>
  import('@/features/route-planner/PlannerPage').then((m) => ({ default: m.PlannerPage })),
)
const SimulatorPage = lazy(() =>
  import('@/features/mission-simulator/SimulatorPage').then((m) => ({ default: m.SimulatorPage })),
)
const DataSourcesPage = lazy(() =>
  import('@/features/data-sources/DataSourcesPage').then((m) => ({ default: m.DataSourcesPage })),
)

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route
          path="globe"
          element={
            <PageFallback>
              <GlobePage />
            </PageFallback>
          }
        />
        <Route
          path="explorer"
          element={
            <PageFallback>
              <ExplorerPage />
            </PageFallback>
          }
        />
        <Route
          path="atlas"
          element={
            <PageFallback>
              <AtlasPage />
            </PageFallback>
          }
        />
        <Route
          path="hazards"
          element={
            <PageFallback>
              <HazardsPage />
            </PageFallback>
          }
        />
        <Route
          path="planner"
          element={
            <PageFallback>
              <PlannerPage />
            </PageFallback>
          }
        />
        <Route
          path="simulator"
          element={
            <PageFallback>
              <SimulatorPage />
            </PageFallback>
          }
        />
        <Route
          path="data-sources"
          element={
            <PageFallback>
              <DataSourcesPage />
            </PageFallback>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
