import { Menu } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { TooltipProvider } from '@/components/ui/tooltip'
import { NAV_ITEMS, type NavItem } from './navConfig'
import { LogoMark } from './LogoMark'
import { useUiStore } from '@/stores/uiStore'
import { cn } from '@/utils/cn'

const linkBase =
  'relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70'
const linkIdle = 'text-ink-dim hover:bg-white/[0.05] hover:text-ink'
const linkActive = 'text-ink'

function NavLinkItem({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const { to, label, icon: Icon } = item
  return (
    <NavLink
      to={to}
      end={to === '/'}
      onClick={onNavigate}
      className={({ isActive }) => cn(linkBase, isActive ? linkActive : linkIdle)}
    >
      {({ isActive }) => (
        <>
          {isActive ? (
            <span
              aria-hidden="true"
              className="absolute inset-x-2 -bottom-[1px] h-[2px] rounded-full bg-accent shadow-glow-accent"
            />
          ) : null}
          <Icon className="size-4 shrink-0 opacity-80" />
          {label}
        </>
      )}
    </NavLink>
  )
}

export function TopNav() {
  const setNavOpen = useUiStore((s) => s.setNavOpen)
  return (
    <header className="glass-nav sticky top-0 z-40">
      <TooltipProvider delayDuration={200}>
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <NavLink
            to="/"
            className="flex items-center gap-3 rounded-lg pr-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70"
            aria-label="ARES — Mission Control home"
          >
            <LogoMark className="size-8 shrink-0" />
            <span className="flex flex-col leading-none">
              <span className="font-display text-lg font-bold tracking-[0.18em] text-ink">ARES</span>
              <span className="mt-1 hidden text-[10px] font-mono uppercase tracking-[0.28em] text-ink-faint sm:block">
                Mars Mission Explorer
              </span>
            </span>
          </NavLink>

          <nav className="ml-2 hidden flex-1 items-center gap-0.5 lg:flex" aria-label="Primary">
            {NAV_ITEMS.map((item) => (
              <NavLinkItem key={item.to} item={item} />
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden rounded border border-line bg-white/[0.03] px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-ink-faint md:inline-flex">
              NASA Space Apps 2026
            </span>
            <Button
              variant="secondary"
              size="icon"
              className="lg:hidden"
              aria-label="Open navigation"
              onClick={() => setNavOpen(true)}
            >
              <Menu className="size-5" />
            </Button>
          </div>
        </div>
      </TooltipProvider>
    </header>
  )
}
