import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

/**
 * Shared user-facing error for DEM loading failures (Hazards, Planner, Explorer).
 *
 * Shows a short actionable message; the full diagnostic error is logged to the console
 * (kept out of the public UI) so support/debugging still has the real cause — e.g. an
 * HTTP 404 for a missing DEM asset in a deployment.
 */
export function TerrainLoadError({ error }: { error: unknown }) {
  useEffect(() => {
    // Keep the real diagnostic (status, URL, parse failure) in the console.
    console.error('Terrain grid failed to load:', error)
  }, [error])

  const detail = error instanceof Error ? error.message : String(error)
  // Short, non-internal summary: keep the HTTP status / reason but drop long URLs.
  const shortDetail = detail.replace(/\sfor\shttps?:\/\/\S+/g, '')

  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-danger">
      <AlertTriangle className="size-6" aria-hidden="true" />
      <span className="font-mono text-xs">Terrain grid failed to load.</span>
      <span className="max-w-md font-mono text-[10px] leading-relaxed text-ink-dim">
        {shortDetail}
      </span>
      <span className="font-mono text-[10px] text-ink-faint">
        Check the browser console for details and try reloading.
      </span>
    </div>
  )
}
