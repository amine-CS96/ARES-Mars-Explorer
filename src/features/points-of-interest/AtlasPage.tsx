import { useMemo, useState } from 'react'
import { SearchX, Search } from 'lucide-react'
import { places } from '@/data/places'
import { POI_CATEGORIES, type PoICategory, type PointOfInterest } from '@/types/poi'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PoiCard } from './PoiCard'
import { PoiDetailDialog } from './PoiDetailDialog'
import { cn } from '@/utils/cn'

const CATEGORY_FILTERS: Array<{ id: PoICategory | 'all'; label: string }> = [
  { id: 'all', label: 'All' },
  ...POI_CATEGORIES.map((c) => ({ id: c, label: c.replace('-', ' ') })),
]

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * Module D — searchable, source-cited atlas of Martian exploration locations.
 * Data comes from the zod-validated catalog; accuracy labels are never stripped.
 */
export function AtlasPage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<PoICategory | 'all'>('all')
  const [selected, setSelected] = useState<PointOfInterest | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return places.filter((p) => {
      const matchesCategory = category === 'all' || p.category === category
      if (!matchesCategory) return false
      if (q === '') return true
      const haystack = `${p.name} ${p.summary} ${p.missions.join(' ')} ${p.region}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [query, category])

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="animate-fade-up">
        <p className="eyebrow mb-2">Exploration Atlas</p>
        <h1 className="font-display text-3xl font-bold tracking-wide text-ink sm:text-4xl">
          Exploration Atlas
        </h1>
        <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-ink-dim">
          Curated Martian exploration sites with coordinates, geology, mission context and
          explicit sources. Every entry carries an accuracy label — verified coordinates come
          from NASA/JPL and USGS references; nothing here is invented.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-4">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sites, missions, regions…"
            aria-label="Search points of interest"
            className="h-10 w-full rounded-lg border border-line bg-surface/60 pl-9 pr-4 text-sm text-ink placeholder:text-ink-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {CATEGORY_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setCategory(filter.id)}
              aria-pressed={category === filter.id}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70',
                category === filter.id
                  ? 'border-accent/60 bg-accent/15 text-accent-strong'
                  : 'border-line text-ink-dim hover:border-line-strong hover:text-ink',
              )}
            >
              {filter.id === 'all' ? filter.label : capitalize(filter.label)}
            </button>
          ))}
          <Badge variant="outline" className="ml-auto">
            {filtered.length} / {places.length} sites
          </Badge>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((place) => (
            <PoiCard key={place.id} place={place} onOpen={setSelected} />
          ))}
        </div>
      ) : (
        <div className="panel mt-8 flex flex-col items-center gap-3 px-6 py-16 text-center">
          <SearchX className="size-8 text-ink-faint" aria-hidden="true" />
          <p className="font-display text-lg font-semibold text-ink">No matching sites</p>
          <p className="max-w-sm text-sm text-ink-dim">
            Try a different search term or clear the filters.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setQuery('')
              setCategory('all')
            }}
          >
            Clear filters
          </Button>
        </div>
      )}

      <PoiDetailDialog place={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </div>
  )
}
