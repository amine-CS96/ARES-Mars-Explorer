import { MousePointer2, Satellite } from 'lucide-react'
import { formatLatLon } from '@/utils/geo'
import type { LatLon } from '@/types/geo'

interface CoordinateBarProps {
  cursor: LatLon | null
  center: LatLon
  zoom: number
  activeLayerName: string
  tileStatus?: { loaded: number; total: number; failed: number }
}

export function CoordinateBar({
  cursor,
  center,
  zoom,
  activeLayerName,
  tileStatus,
}: CoordinateBarProps) {
  const loading = tileStatus && tileStatus.total > 0 && tileStatus.loaded < tileStatus.total

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-space/95 px-4 py-2 text-[11px] text-ink-dim backdrop-blur-md">
      <div className="flex flex-wrap items-center gap-4">
        <span className="flex items-center gap-1.5">
          <MousePointer2 className="size-3.5 text-cyan/80" aria-hidden="true" />
          {cursor ? formatLatLon(cursor, { decimals: 5 }) : 'Cursor — hover the map'}
        </span>
        <span className="hidden font-mono text-[10px] text-ink-faint sm:inline">
          Center {formatLatLon(center, { decimals: 4 })} · Zoom {zoom}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <span className="flex items-center gap-1.5">
          <Satellite className="size-3.5 text-cyan/80" aria-hidden="true" />
          {activeLayerName}
        </span>
        {tileStatus ? (
          <span className="font-mono text-[10px]">
            {loading ? (
              <span className="text-amber">Loading tiles… {tileStatus.loaded}/{tileStatus.total}</span>
            ) : tileStatus.failed > 0 ? (
              <span className="text-amber">{tileStatus.failed} tiles failed</span>
            ) : (
              <span className="text-success">{tileStatus.loaded} tiles ready</span>
            )}
          </span>
        ) : null}
        <span className="hidden text-[10px] text-ink-faint sm:inline">
          Data: NASA/JPL-Caltech/USGS/ESA/DLR/ASU/MSSS/University of Arizona
        </span>
      </div>
    </div>
  )
}
