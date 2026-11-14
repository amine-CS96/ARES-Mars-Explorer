import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { buildTrekTileUrl, type TileCoordinate } from '@/services/nasa/marsTrekProvider'
import type { TrekLayer } from '@/services/nasa/types'

export interface MosaicProgress {
  loaded: number
  total: number
}

export interface MosaicResult {
  canvas: HTMLCanvasElement
  width: number
  height: number
  tilesTotal: number
  tilesFailed: number
  minX: number
  minY: number
}

function loadTileImage(src: string, signal?: AbortSignal): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.decoding = 'async'
    const onAbort = () => {
      img.src = ''
      reject(new DOMException('Tile load aborted', 'AbortError'))
    }
    signal?.addEventListener('abort', onAbort, { once: true })
    img.onload = () => {
      signal?.removeEventListener('abort', onAbort)
      resolve(img)
    }
    img.onerror = () => {
      signal?.removeEventListener('abort', onAbort)
      reject(new Error(`Tile failed: ${src}`))
    }
    img.src = src
  })
}

/**
 * Compose an arbitrary list of WMTS tiles onto a canvas. Used by the regional 2D/3D explorer.
 * Failed tiles stay transparent/dark and are counted; the caller decides how to present them.
 */
export async function composeTileMosaic(
  layer: TrekLayer,
  tiles: TileCoordinate[],
  options: {
    signal?: AbortSignal
    maxParallel?: number
    onProgress?: (progress: MosaicProgress) => void
  } = {},
): Promise<MosaicResult> {
  const { signal, maxParallel = 6, onProgress } = options
  if (tiles.length === 0) throw new Error('No tiles requested')

  const tileSet = new Set(tiles.map((t) => `${t.z}/${t.x}/${t.y}`))
  if (tileSet.size !== tiles.length) {
    // deduplicate just in case
    const seen = new Set<string>()
    tiles = tiles.filter((t) => {
      const key = `${t.z}/${t.x}/${t.y}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  // Determine canvas bounds from tile coordinates.
  const minX = Math.min(...tiles.map((t) => t.x))
  const maxX = Math.max(...tiles.map((t) => t.x))
  const minY = Math.min(...tiles.map((t) => t.y))
  const maxY = Math.max(...tiles.map((t) => t.y))
  const width = (maxX - minX + 1) * 256
  const height = (maxY - minY + 1) * 256

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D unavailable')

  let loaded = 0
  let failed = 0
  const queue = [...tiles]

  const worker = async (): Promise<void> => {
    while (queue.length > 0) {
      if (signal?.aborted) throw new DOMException('Mosaic aborted', 'AbortError')
      const tile = queue.shift()!
      try {
        const img = await loadTileImage(buildTrekTileUrl(layer, tile), signal)
        ctx.drawImage(img, (tile.x - minX) * 256, (tile.y - minY) * 256)
        loaded++
      } catch {
        if (signal?.aborted) throw new DOMException('Mosaic aborted', 'AbortError')
        failed++
      }
      onProgress?.({ loaded, total: tiles.length })
    }
  }

  await Promise.all(Array.from({ length: Math.min(maxParallel, tiles.length) }, () => worker()))

  if (loaded === 0) {
    throw new Error(`All ${tiles.length} tiles failed for ${layer.id}`)
  }

  return { canvas, width, height, tilesTotal: tiles.length, tilesFailed: failed, minX, minY }
}

/**
 * TanStack Query wrapper around {@link composeTileMosaic}. Caches per (layer, zoom, region bbox)
 * for the session.
 */
export function useTileMosaic(layer: TrekLayer, tiles: TileCoordinate[]) {
  const [progress, setProgress] = useState<MosaicProgress>({ loaded: 0, total: 0 })

  const query = useQuery<MosaicResult>({
    queryKey: ['region-mosaic', layer.id, tiles.map((t) => `${t.z}/${t.x}/${t.y}`).join(',')],
    queryFn: ({ signal }) => composeTileMosaic(layer, tiles, { signal, onProgress: setProgress }),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 10 * 60 * 1000,
    retry: 1,
    placeholderData: (previousData) => previousData,
  })

  return { query, progress }
}
