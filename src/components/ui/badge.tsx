import { cva, type VariantProps } from 'class-variance-authority'
import type { HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider',
  {
    variants: {
      variant: {
        default: 'border-accent/40 bg-accent/12 text-accent-strong',
        outline: 'border-line-strong bg-transparent text-ink-dim',
        neutral: 'border-transparent bg-white/[0.06] text-ink-dim',
        success: 'border-success/40 bg-success/10 text-success',
        warning: 'border-amber/40 bg-amber/10 text-amber',
        danger: 'border-danger/40 bg-danger/10 text-danger',
        cyan: 'border-cyan/40 bg-cyan/10 text-cyan',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  },
)

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
