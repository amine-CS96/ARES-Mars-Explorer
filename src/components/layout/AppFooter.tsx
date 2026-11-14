import { ATTRIBUTION_LINE, DISCLAIMER_LINE } from '@/services/nasa/dataCatalog'
import { Separator } from '@/components/ui/separator'

export function AppFooter() {
  return (
    <footer className="mt-16 border-t border-line bg-surface/40">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-ink-faint">
            ARES · Mars Mission Explorer · {new Date().getFullYear()}
          </p>
          <p className="font-mono text-[11px] text-ink-faint">
            Explore Mars. Plan Smarter. Survive Further.
          </p>
        </div>
        <Separator className="my-4" />
        <p className="max-w-4xl text-xs leading-relaxed text-ink-faint">{ATTRIBUTION_LINE}</p>
        <p className="mt-2 max-w-4xl text-xs leading-relaxed text-ink-faint">{DISCLAIMER_LINE}</p>
      </div>
    </footer>
  )
}
