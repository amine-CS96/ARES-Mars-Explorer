import { useEffect, useRef, useState } from 'react'
import { tileGridForZoom } from '@/services/nasa/marsTrekProvider'
import type { useTileMosaic } from './useTileMosaic'
import type { RegionConfig } from './regionConfig'
import {
  clampCenter,
  latLonToPixel,
  pixelToLatLon,
  TILE_SIZE,
  type ViewportSize,
} from './viewport'

/**
 * 2D slippy-map canvas for a regional WMTS layer. Computes visible tiles from the current
 * center/zoom, composites them via the supplied mosaic hook, and draws the result into a
 * viewport-sized canvas. Pan and zoom are pointer/wheel driven.
 *
 * Optional overlays (e.g. a hazard raster) are drawn after the tiles using their geographic bbox.
 * Optional onClick reports the lat/lon of a single click (not a drag).
 */

export interface MapOverlay {
  canvas: HTMLCanvasElement
  bbox: { west: number; south: number; east: number; north: number }
  opacity?: number
}

interface TileMapProps {
  config: RegionConfig
  zoom: number
  center: { lat: number; lon: number }
  onCenterChange: (center: { lat: number; lon: number }) => void
  onZoomChange: (zoom: number) => void
  onCursor?: (point: { lat: number; lon: number } | null) => void
  onClick?: (point: { lat: number; lon: number }) => void
  mosaic: ReturnType<typeof useTileMosaic>
  overlays?: MapOverlay[]
}

export function TileMap({
  config,
  zoom,
  center,
  onCenterChange,
  onZoomChange,
  onCursor,
  onClick,
  mosaic,
  overlays,
}: TileMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [size, setSize] = useState<ViewportSize>({ width: 0, height: 0 })
  const [dragging, setDragging] = useState(false)
  const lastPointer = useRef({ x: 0, y: 0 })
  const dragThreshold = useRef(false)

  // Observe container size
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => {
      const rect = el.getBoundingClientRect()
      setSize({ width: Math.floor(rect.width), height: Math.floor(rect.height) })
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Draw the mosaic (or previous placeholder) into the viewport canvas.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || size.width === 0 || size.height === 0) return
    canvas.width = size.width
    canvas.height = size.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Dark underlay when data is loading / missing.
    ctx.fillStyle = '#10151f'
    ctx.fillRect(0, 0, size.width, size.height)

    const data = mosaic.query.data
    if (!data) return

    const { cols, rows } = tileGridForZoom(zoom)
    const worldW = cols * TILE_SIZE
    const worldH = rows * TILE_SIZE
    const centerPx = {
      x: ((center.lon + 180) / 360) * worldW,
      y: ((90 - center.lat) / 180) * worldH,
    }
    const topLeft = {
      x: centerPx.x - size.width / 2,
      y: centerPx.y - size.height / 2,
    }

    const drawX = Math.round(data.minX * TILE_SIZE - topLeft.x)
    const drawY = Math.round(data.minY * TILE_SIZE - topLeft.y)
    ctx.drawImage(data.canvas, drawX, drawY)

    // Draw optional geographic overlays (e.g. hazard raster).
    if (overlays && overlays.length > 0) {
      for (const overlay of overlays) {
        const { x: sx, y: sy } = latLonToPixel(
          { lat: overlay.bbox.north, lon: overlay.bbox.west },
          center,
          zoom,
          size,
        )
        const { x: ex, y: ey } = latLonToPixel(
          { lat: overlay.bbox.south, lon: overlay.bbox.east },
          center,
          zoom,
          size,
        )
        const prevAlpha = ctx.globalAlpha
        ctx.globalAlpha = overlay.opacity ?? 0.55
        ctx.drawImage(overlay.canvas, sx, sy, ex - sx, ey - sy)
        ctx.globalAlpha = prevAlpha
      }
    }
  }, [mosaic.query.data, size, zoom, center, overlays])

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    if (dragging) {
      const dx = x - lastPointer.current.x
      const dy = y - lastPointer.current.y
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dragThreshold.current = true
      lastPointer.current = { x, y }
      panByPixels(dx, dy)
    }

    onCursor?.(pixelToLatLon(x, y, center, zoom, size))
  }

  const panByPixels = (dx: number, dy: number) => {
    const { cols, rows } = tileGridForZoom(zoom)
    const worldW = cols * TILE_SIZE
    const worldH = rows * TILE_SIZE
    const dLon = (dx / worldW) * 360
    const dLat = -(dy / worldH) * 180
    onCenterChange(clampCenter({ lat: center.lat + dLat, lon: center.lon - dLon }, config.bbox))
  }

  // React's onWheel is passive by default, so we attach an active listener manually
  // to allow preventDefault and stop the page from scrolling while zooming the map.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      const delta = event.deltaY > 0 ? -1 : 1
      const newZoom = Math.max(config.minZoom, Math.min(config.maxZoom, zoom + delta))
      if (newZoom !== zoom) onZoomChange(newZoom)
    }
    canvas.addEventListener('wheel', handleWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', handleWheel)
  }, [config.maxZoom, config.minZoom, onZoomChange, zoom])

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-space">
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 ${dragging ? 'cursor-grabbing' : 'cursor-crosshair'}`}
        onPointerDown={(e) => {
          setDragging(true)
          dragThreshold.current = false
          lastPointer.current = { x: e.clientX - e.currentTarget.getBoundingClientRect().left, y: e.clientY - e.currentTarget.getBoundingClientRect().top }
          e.currentTarget.setPointerCapture(e.pointerId)
        }}
        onPointerUp={(e) => {
          setDragging(false)
          e.currentTarget.releasePointerCapture(e.pointerId)
          if (!dragThreshold.current) {
            const rect = e.currentTarget.getBoundingClientRect()
            const px = e.clientX - rect.left
            const py = e.clientY - rect.top
            onClick?.(pixelToLatLon(px, py, center, zoom, size))
          }
        }}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => onCursor?.(null)}
      />
    </div>
  )
}
