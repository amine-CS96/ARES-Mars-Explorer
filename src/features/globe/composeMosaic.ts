import { buildTrekTileUrl, type TileCoordinate } from '@/services/nasa/marsTrekProvider'
import type { TrekLayer } from '@/services/nasa/types'
import { GLOBE_MATERIAL_COLORS, listTilesForZoom } from './math'

/**
 * Client-side mosaic composition for the globe texture.
 *
 * Why: NASA Mars Trek serves the verified global layers as WMTS tiles, not as one downloadable
 * equirectangular image (no single-image endpoint is verified — see docs/DATA_SOURCES.md). So
 * the globe texture is DERIVED in the browser by compositing verified tiles onto a canvas,
 * exactly as a map client would. Tiles load with `crossOrigin='anonymous'`; Trek serves
 * `Access-Control-Allow-Origin: *` (verified 2026-11-14, docs/KNOWN_ISSUES.md K-6), which keeps
 * the canvas untainted and safe as a WebGL texture source.
 *
 * Honesty: the result is labeled `derived` in the UI. If some tiles fail, they stay dark and
 * the count is surfaced — never silently papered over.
 */

const TILE_PX = 256

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
  failedTiles: TileCoordinate[]
}

function loadTileImage(src: string, signal?: AbortSignal): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.decoding = 'async'
    const onAbort = () => {
      img.src = ''
      reject(new DOMException('Mosaic load aborted', 'AbortError'))
    }
    signal?.addEventListener('abort', onAbort, { once: true })
    img.onload = () => {
      signal?.removeEventListener('abort', onAbort)
      resolve(img)
    }
    img.onerror = () => {
      signal?.removeEventListener('abort', onAbort)
      reject(new Error(`Tile request failed: ${src}`))
    }
    img.src = src
  })
}

/**
 * Compose every tile of `layer` at `zoom` into one canvas. Fails only when the whole mosaic
 * is unusable (abort / catastrophic failure); individual tile failures are reported on the
 * result so the UI can disclose them.
 */
export async function composeMosaic(
  layer: TrekLayer,
  zoom: number,
  options: {
    signal?: AbortSignal
    maxParallel?: number
    onProgress?: (progress: MosaicProgress) => void
  } = {},
): Promise<MosaicResult> {
  const { signal, maxParallel = 6, onProgress } = options
  const tiles = listTilesForZoom(zoom)
  const cols = 2 ** (zoom + 1)
  const width = cols * TILE_PX
  const height = 2 ** zoom * TILE_PX

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable — mosaic composition impossible')

  // Dark underlay: any tile that fails stays a visible dark patch instead of a black hole or
  // a faked replacement.
  ctx.fillStyle = GLOBE_MATERIAL_COLORS.missingTile
  ctx.fillRect(0, 0, width, height)

  let drawn = 0 // successful draws only — progress is monotonic and honest
  const failedTiles: TileCoordinate[] = []
  const pending: TileCoordinate[] = []
  const queue: TileCoordinate[] = [...tiles]

  const worker = async (): Promise<void> => {
    while (queue.length > 0) {
      if (signal?.aborted) throw new DOMException('Mosaic load aborted', 'AbortError')
      const tile = queue.shift()!
      try {
        const img = await loadTileImage(buildTrekTileUrl(layer, tile), signal)
        ctx.drawImage(img, tile.x * TILE_PX, tile.y * TILE_PX, TILE_PX, TILE_PX)
        drawn += 1
      } catch (error) {
        if (signal?.aborted) throw error
        pending.push(tile) // retried once after the first pass; Trek can be slow under load
      }
      onProgress?.({ loaded: drawn, total: tiles.length })
    }
  }

  const runPass = async (): Promise<void> => {
    const parallel = Math.min(maxParallel, tiles.length)
    await Promise.all(Array.from({ length: parallel }, () => worker()))
  }

  await runPass()

  // One bounded retry for tiles that failed (e.g. transient net::ERR_TIMED_OUT).
  if (pending.length > 0 && !signal?.aborted) {
    queue.push(...pending)
    pending.length = 0
    await runPass()
  }

  failedTiles.push(...pending)

  const usable = tiles.length - failedTiles.length
  if (usable === 0) {
    throw new Error(`All ${tiles.length} tiles failed for ${layer.id} — mosaic unavailable`)
  }

  return {
    canvas,
    width,
    height,
    tilesTotal: tiles.length,
    tilesFailed: failedTiles.length,
    failedTiles,
  }
}
