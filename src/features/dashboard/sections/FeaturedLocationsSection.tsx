import { useState } from 'react'
import { Link } from 'react-router-dom'
import { featuredPlaces } from '@/data/places'
import type { PointOfInterest } from '@/types/poi'
import { SectionHeading } from '@/components/ui/section-heading'
import { PoiCard } from '@/features/points-of-interest/PoiCard'
import { PoiDetailDialog } from '@/features/points-of-interest/PoiDetailDialog'

/** Module A — featured sites from the verified catalog (no hardcoded duplicates). */
export function FeaturedLocationsSection() {
  const [selected, setSelected] = useState<PointOfInterest | null>(null)

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6">
      <SectionHeading
        eyebrow="Featured locations"
        title="Sites worth the walk"
        description="Featured entries from the Exploration Atlas — every coordinate carries an accuracy label and a source."
        action={
          <Link
            to="/atlas"
            className="rounded-lg font-mono text-xs uppercase tracking-wider text-cyan/90 underline-offset-4 transition-colors hover:text-cyan hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70"
          >
            View all sites →
          </Link>
        }
      />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {featuredPlaces.map((place) => (
          <PoiCard key={place.id} place={place} onOpen={setSelected} />
        ))}
      </div>
      <PoiDetailDialog place={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </section>
  )
}
