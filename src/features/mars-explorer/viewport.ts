import { tileGridForZoom } from '@/services/nasa/marsTrekProvider'
import type { RegionConfig } from './regionConfig'

export const TILE_SIZE = 256

export interface ViewportSize {
  width: number
  height: number
}

export interface TileCoord {
  z: number
  x: number
  y: number
}

export function computeVisibleTiles(
  center: { lat: number; lon: number },
  zoom: number,
  size: ViewportSize,
): TileCoord[] {
  const { cols, rows } = tileGridForZoom(zoom)
  const worldW = cols * TILE_SIZE
  const worldH = rows * TILE_SIZE
  const centerPx = {
    x: ((center.lon + 180) / 360) * worldW,
    y: ((90 - center.lat) / 180) * worldH,
  }
  const topLeft = { x: centerPx.x - size.width / 2, y: centerPx.y - size.height / 2 }
  const bottomRight = { x: topLeft.x + size.width, y: topLeft.y + size.height }

  const minX = Math.floor(topLeft.x / TILE_SIZE)
  const maxX = Math.floor(bottomRight.x / TILE_SIZE)
  const minY = Math.floor(topLeft.y / TILE_SIZE)
  const maxY = Math.floor(bottomRight.y / TILE_SIZE)

  const tiles: TileCoord[] = []
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (x >= 0 && x < cols && y >= 0 && y < rows) tiles.push({ z: zoom, x, y })
    }
  }
  return tiles
}

export function latLonToPixel(
  point: { lat: number; lon: number },
  center: { lat: number; lon: number },
  zoom: number,
  size: ViewportSize,
): { x: number; y: number } {
  const { cols, rows } = tileGridForZoom(zoom)
  const worldW = cols * TILE_SIZE
  const worldH = rows * TILE_SIZE
  const centerPx = {
    x: ((center.lon + 180) / 360) * worldW,
    y: ((90 - center.lat) / 180) * worldH,
  }
  const topLeft = { x: centerPx.x - size.width / 2, y: centerPx.y - size.height / 2 }
  const worldX = ((point.lon + 180) / 360) * worldW
  const worldY = ((90 - point.lat) / 180) * worldH
  return { x: worldX - topLeft.x, y: worldY - topLeft.y }
}

export function pixelToLatLon(
  px: number,
  py: number,
  center: { lat: number; lon: number },
  zoom: number,
  size: ViewportSize,
): { lat: number; lon: number } {
  const { cols, rows } = tileGridForZoom(zoom)
  const worldW = cols * TILE_SIZE
  const worldH = rows * TILE_SIZE
  const centerPx = {
    x: ((center.lon + 180) / 360) * worldW,
    y: ((90 - center.lat) / 180) * worldH,
  }
  const topLeft = { x: centerPx.x - size.width / 2, y: centerPx.y - size.height / 2 }
  const worldX = topLeft.x + px
  const worldY = topLeft.y + py
  const lon = (worldX / worldW) * 360 - 180
  const lat = 90 - (worldY / worldH) * 180
  return { lat, lon }
}

export function clampCenter(
  center: { lat: number; lon: number },
  bbox: RegionConfig['bbox'],
): { lat: number; lon: number } {
  return {
    lat: Math.max(bbox.south, Math.min(bbox.north, center.lat)),
    lon: Math.max(bbox.west, Math.min(bbox.east, center.lon)),
  }
}
