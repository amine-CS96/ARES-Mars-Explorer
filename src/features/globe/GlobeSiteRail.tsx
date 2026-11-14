import type { PointOfInterest } from '@/types/poi'
import { GLOBE_MATERIAL_COLORS } from './math'

/**
 * "Jump to site" rail — the keyboard-accessible path to every marker (3D canvas interaction
 * is pointer-only). Selecting a site flies the camera and opens the shared Atlas dialog.
 */
interface GlobeSiteRailProps {
  places: PointOfInterest[]
  selectedId: string | null
  onSelect: (place: PointOfInterest) => void
}

export function GlobeSiteRail({ places, selectedId, onSelect }: GlobeSiteRailProps) {
  return (
    <section aria-label="Jump to site" className="space-y-2">
      <span className="eyebrow">Jump to site</span>
      <ul className="flex flex-wrap gap-1.5">
        {places.map((place) => (
          <li key={place.id}>
            <button
              type="button"
              aria-pressed={place.id === selectedId}
              onClick={() => onSelect(place)}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70 ${
                place.id === selectedId
                  ? 'border-cyan/50 bg-cyan/10 text-cyan'
                  : 'border-line bg-surface/60 text-ink-dim hover:border-line-strong hover:text-ink'
              }`}
            >
              <span
                aria-hidden="true"
                className="inline-block size-2 rounded-full"
                style={{ backgroundColor: GLOBE_MATERIAL_COLORS.markers[place.category] }}
              />
              {place.name}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
