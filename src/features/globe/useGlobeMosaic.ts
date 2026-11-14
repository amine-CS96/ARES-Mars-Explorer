import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { TrekLayer } from '@/services/nasa/types'
import { composeMosaic, type MosaicProgress, type MosaicResult } from './composeMosaic'

/**
 * TanStack Query wrapper around {@link composeMosaic}. The composed canvas is cached per
 * (layer, zoom) for the session — switching back to a layer already composed this visit is
 * instant and costs no tile requests.
 */
export function useGlobeMosaic(layer: TrekLayer, zoom: number) {
  const [progress, setProgress] = useState<MosaicProgress>({ loaded: 0, total: 0 })

  const query = useQuery<MosaicResult>({
    queryKey: ['globe-mosaic', layer.id, zoom],
    queryFn: ({ signal }) =>
      composeMosaic(layer, zoom, { signal, onProgress: setProgress }),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 15 * 60 * 1000,
    retry: 1,
    // While a new layer/tier composes, keep showing the previous mosaic — a map client's
    // "previous frame" behavior, never a blank or fake planet. isPlaceholderData marks it.
    placeholderData: (previousData) => previousData,
  })

  return { query, progress }
}
