import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="eyebrow">Off the nav chart</p>
      <h1 className="font-display text-3xl font-bold tracking-wide text-ink">404</h1>
      <p className="text-sm leading-relaxed text-ink-dim">
        That coordinate is not on the ARES chart. Return to Mission Control and re-plot.
      </p>
      <Button asChild>
        <Link to="/" aria-label="Back to Mission Control">
          Back to Mission Control
        </Link>
      </Button>
      <Compass className="mt-4 size-5 text-ink-faint" aria-hidden="true" />
    </div>
  )
}
