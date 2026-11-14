import { Suspense, type ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

/** Lazy-page shell: keeps layout height stable while chunks load. */
export function PageFallback({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl space-y-4 px-4 py-12 sm:px-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 max-w-full" />
          <div className="grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        </div>
      }
    >
      {children}
    </Suspense>
  )
}
