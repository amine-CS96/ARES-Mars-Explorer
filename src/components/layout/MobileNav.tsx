import { NavLink, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { NAV_ITEMS } from './navConfig'
import { LogoMark } from './LogoMark'
import { useUiStore } from '@/stores/uiStore'
import { cn } from '@/utils/cn'

const linkBase =
  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70'
const linkIdle = 'text-ink-dim hover:bg-white/[0.06] hover:text-ink'
const linkActive = 'bg-white/[0.06] text-ink'

/** Right-side sheet navigation for small screens (Radix Dialog for focus handling). */
export function MobileNav() {
  const open = useUiStore((s) => s.navOpen)
  const setNavOpen = useUiStore((s) => s.setNavOpen)
  const location = useLocation()

  // Close the drawer whenever the route changes (user navigated from the sheet).
  useEffect(() => {
    setNavOpen(false)
  }, [location.pathname, setNavOpen])

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setNavOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-space/80 backdrop-blur-sm" />
        <DialogPrimitive.Content
          className={cn(
            'fixed inset-y-0 right-0 z-50 flex w-72 max-w-[85vw] flex-col gap-6 overflow-y-auto',
            'border-l border-line bg-surface p-5 shadow-panel focus:outline-none',
          )}
        >
          <div className="flex items-center justify-between">
            <DialogPrimitive.Title className="flex items-center gap-3">
              <LogoMark className="size-7" />
              <span className="font-display text-base font-bold tracking-[0.18em] text-ink">
                ARES
              </span>
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              className="rounded-md p-1.5 text-ink-faint transition-colors hover:bg-white/[0.06] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70"
              aria-label="Close navigation"
            />
          </div>

          <DialogPrimitive.Description className="sr-only">
            ARES module navigation
          </DialogPrimitive.Description>

          <nav className="flex flex-col gap-1" aria-label="Mobile primary">
            {NAV_ITEMS.map((item) => {
              const { to, label, icon: Icon } = item
              return (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) => cn(linkBase, isActive ? linkActive : linkIdle)}
                >
                  <Icon className="size-4 shrink-0 opacity-80" />
                  {label}
                </NavLink>
              )
            })}
          </nav>

          <div className="mt-auto flex flex-col gap-3 border-t border-line pt-4">
            <span className="w-fit rounded border border-line bg-white/[0.03] px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-ink-faint">
              NASA Space Apps 2026
            </span>
            <p className="text-[11px] leading-relaxed text-ink-faint">
              Data: NASA/JPL/USGS/ESA. Educational project — not an operational safety system.
            </p>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
