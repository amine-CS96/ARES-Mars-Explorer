import { useEffect, useState } from 'react'

/**
 * Reactive `prefers-reduced-motion` media query. The globe uses it to disable the idle spin
 * and jump-cut camera flights (base styles already damp CSS motion globally).
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const listener = (event: MediaQueryListEvent): void => setReduced(event.matches)
    query.addEventListener('change', listener)
    return () => query.removeEventListener('change', listener)
  }, [])

  return reduced
}
