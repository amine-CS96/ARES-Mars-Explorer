import { cn } from '@/utils/cn'
import { MOBILITY_PROFILES, type MobilityProfile } from '@/engines/hazards/riskModel'

interface MissionProfileSelectorProps {
  value: string
  onChange: (profile: MobilityProfile) => void
  compact?: boolean
}

/**
 * Mobility profile selector. Compact mode renders selectable rows with per-profile thresholds;
 * every profile change re-runs the real classification (nothing is cached across profiles).
 */
export function MissionProfileSelector({ value, onChange, compact = false }: MissionProfileSelectorProps) {
  return (
    <div className="space-y-1.5">
      {MOBILITY_PROFILES.map((profile) => {
        const active = profile.id === value
        return (
          <button
            key={profile.id}
            type="button"
            onClick={() => onChange(profile)}
            aria-pressed={active}
            className={cn(
              'w-full rounded-lg border p-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70',
              active
                ? 'border-cyan/50 bg-cyan/10'
                : 'border-line bg-white/[0.02] hover:border-line-strong hover:bg-white/[0.045]',
            )}
          >
            <span className={cn('block text-xs font-medium', active ? 'text-cyan' : 'text-ink')}>
              {profile.name}
            </span>
            {!compact ? (
              <span className="mt-0.5 block text-[10px] leading-relaxed text-ink-dim">
                {profile.description}
              </span>
            ) : null}
            <span className="mt-1 block font-mono text-[9px] text-ink-faint">
              max slope {profile.maxTraversableSlopeDeg}° · rough {profile.roughnessThresholdM} m ·
              relief {profile.reliefThresholdM} m
            </span>
          </button>
        )
      })}
    </div>
  )
}
