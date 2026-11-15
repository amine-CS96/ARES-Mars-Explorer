import { Outlet } from 'react-router-dom'
import { TopNav } from './TopNav'
import { MobileNav } from './MobileNav'
import { AppFooter } from './AppFooter'

/** Application chrome: sticky nav, routed content, attribution footer. */
export function AppShell() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:border focus:border-cyan focus:bg-space focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:text-cyan"
      >
        Skip to content
      </a>
      <TopNav />
      <MobileNav />
      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
        <Outlet />
      </main>
      <AppFooter />
    </div>
  )
}
