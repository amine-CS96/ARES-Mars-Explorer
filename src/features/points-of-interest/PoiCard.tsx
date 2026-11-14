import { ArrowUpRight } from 'lucide-react'
import type { PointOfInterest } from '@/types/poi'
import { formatLatLon } from '@/utils/geo'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AccuracyBadge, CategoryBadge, FictionBadge } from '@/components/ui/status-badges'
import { cn } from '@/utils/cn'

interface PoiCardProps {
  place: PointOfInterest
  onOpen: (place: PointOfInterest) => void
  className?: string
}

/** Compact card for Atlas grid and dashboard featured locations. */
export function PoiCard({ place, onOpen, className }: PoiCardProps) {
  return (
    <Card
      className={cn(
        'group cursor-pointer transition-colors hover:border-line-strong hover:bg-white/[0.045]',
        className,
      )}
      role="button"
      tabIndex={0}
      aria-label={`Open details for ${place.name}`}
      onClick={() => onOpen(place)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen(place)
        }
      }}
    >
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge category={place.category} />
          <AccuracyBadge accuracy={place.accuracy} />
          {place.category === 'fiction' ? <FictionBadge /> : null}
        </div>
        <CardTitle className="flex items-center justify-between gap-2">
          <span>{place.name}</span>
          <ArrowUpRight className="size-4 shrink-0 text-ink-faint transition-colors group-hover:text-cyan" />
        </CardTitle>
        <p className="font-mono text-xs text-cyan/90">{formatLatLon(place.coordinates)}</p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <p className="line-clamp-3 text-sm leading-relaxed text-ink-dim">{place.summary}</p>
        <div className="mt-auto flex flex-wrap items-center gap-2">
          {place.missions.slice(0, 2).map((mission) => (
            <Badge key={mission} variant="neutral" className="normal-case tracking-normal">
              {mission}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
