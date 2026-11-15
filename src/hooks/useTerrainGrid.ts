import { useQuery } from '@tanstack/react-query'
import { loadTerrainGrid, type TerrainGrid, type TerrainGridSource } from '@/engines/terrain/terrainGrid'

/**
 * Load a real Mars terrain grid (elevation + slope) from the committed pipeline outputs.
 *
 * The grid is immutable for the session, so it is cached indefinitely. The caller receives a
 * transparent loading/error state.
 */
export function useTerrainGrid(source: TerrainGridSource) {
  return useQuery<TerrainGrid>({
    queryKey: ['terrain-grid', source.metadataUrl, source.heightmapUrl, source.slopeUrl],
    queryFn: ({ signal }) =>
      loadTerrainGrid(source).then((grid) => {
        if (signal.aborted) throw new DOMException('Terrain grid load aborted', 'AbortError')
        return grid
      }),
    staleTime: Number.POSITIVE_INFINITY,
    retry: 1,
  })
}
