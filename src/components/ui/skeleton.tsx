import { cn } from '@/utils/cn'

export function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('animate-pulse rounded-md bg-surface-2/80', className)} {...props} />
}
