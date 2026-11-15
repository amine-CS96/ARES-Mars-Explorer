import { Check, Copy, ExternalLink, MapPin, Mountain, Rocket, Route, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import type { PointOfInterest } from '@/types/poi'
import { formatElevationM } from '@/utils/format'
import { formatLatLon } from '@/utils/geo'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  AccuracyBadge,
  CategoryBadge,
  FictionBadge,
} from '@/components/ui/status-badges'
import { Link } from 'react-router-dom'

interface PoiDetailDialogProps {
  place: PointOfInterest | null
  onOpenChange: (open: boolean) => void
}

function CoordinateRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-[11px] uppercase tracking-wider text-ink-faint">{label}</span>
      <span className="font-mono text-xs text-cyan/90">{value}</span>
    </div>
  )
}

/** Full transparency panel for a location: everything ARES knows and where it came from. */
export function PoiDetailDialog({ place, onOpenChange }: PoiDetailDialogProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (text: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      // Clipboard unavailable (permissions/insecure context) — coordinates remain visible.
    }
  }

  return (
    <Dialog open={place !== null} onOpenChange={onOpenChange}>
      {place ? (
        <DialogContent aria-label={`${place.name} details`}>
          <DialogHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CategoryBadge category={place.category} />
              <AccuracyBadge accuracy={place.accuracy} />
              {place.category === 'fiction' ? <FictionBadge /> : null}
            </div>
            <DialogTitle>{place.name}</DialogTitle>
            <DialogDescription>{place.summary}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-line/70 bg-white/[0.02] p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="eyebrow">Coordinates</span>
                <button
                  type="button"
                  onClick={() => handleCopy(`${place.coordinates.lat}, ${place.coordinates.lon}`)}
                  className="inline-flex items-center gap-1 rounded px-1.5 py-1 font-mono text-[10px] uppercase tracking-wider text-ink-faint transition-colors hover:bg-white/[0.06] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70"
                  aria-label="Copy coordinates (decimal degrees)"
                >
                  {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="space-y-2">
                <CoordinateRow label="Decimal" value={formatLatLon(place.coordinates)} />
                <CoordinateRow label="DMS" value={formatLatLon(place.coordinates, { dms: true })} />
                {place.elevationM !== undefined ? (
                  <CoordinateRow
                    label="Elevation"
                    value={formatElevationM(place.elevationM)}
                  />
                ) : null}
              </div>
              {place.coordinateNote ? (
                <p className="mt-3 text-[11px] leading-relaxed text-ink-faint">
                  Note: {place.coordinateNote}
                </p>
              ) : null}
              {place.elevationNote ? (
                <p className="mt-2 text-[11px] leading-relaxed text-ink-faint">
                  {place.elevationNote}
                </p>
              ) : null}
            </div>

            <div className="rounded-lg border border-line/70 bg-white/[0.02] p-4">
              <span className="eyebrow mb-3 block">Context</span>
              <div className="space-y-3 text-sm text-ink-dim">
                {place.geology ? (
                  <p className="flex items-start gap-2">
                    <Mountain className="mt-0.5 size-4 shrink-0 text-cyan/80" />
                    <span className="leading-relaxed">{place.geology}</span>
                  </p>
                ) : null}
                {place.missions.length > 0 ? (
                  <p className="flex items-start gap-2">
                    <Rocket className="mt-0.5 size-4 shrink-0 text-accent" />
                    <span className="leading-relaxed">{place.missions.join(' · ')}</span>
                  </p>
                ) : null}
                {place.hazards.length > 0 ? (
                  <p className="flex items-start gap-2">
                    <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber" />
                    <span className="leading-relaxed">{place.hazards.join(' · ')}</span>
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" asChild>
              <Link
                to={`/explorer?lat=${place.coordinates.lat.toFixed(5)}&lon=${place.coordinates.lon.toFixed(5)}`}
                className="inline-flex items-center gap-1.5"
              >
                <MapPin className="size-3.5" aria-hidden="true" />
                Open in Explorer
              </Link>
            </Button>
            <Button size="sm" variant="secondary" asChild>
              <Link
                to={`/planner?goalLat=${place.coordinates.lat.toFixed(5)}&goalLon=${place.coordinates.lon.toFixed(5)}`}
                className="inline-flex items-center gap-1.5"
              >
                <Route className="size-3.5" aria-hidden="true" />
                Plan route here
              </Link>
            </Button>
          </div>

          <Separator className="my-4" />

          <div>
            <span className="eyebrow mb-2 block">Sources</span>
            <ul className="space-y-1.5">
              {place.sources.map((source) => (
                <li key={source.label} className="flex items-center gap-2 text-xs text-ink-dim">
                  {source.url ? (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1.5 rounded underline-offset-4 transition-colors hover:text-cyan hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70"
                    >
                      <ExternalLink className="size-3 shrink-0" />
                      {source.label}
                    </a>
                  ) : (
                    <Badge variant="neutral" className="normal-case tracking-normal">
                      {source.label}
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </DialogContent>
      ) : null}
    </Dialog>
  )
}
