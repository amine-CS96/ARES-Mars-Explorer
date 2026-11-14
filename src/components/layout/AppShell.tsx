import { Outlet } from 'react-router-dom'
import { TopNav } from './TopNav'
import { MobileNav } from './MobileNav'
import { AppFooter } from './AppFooter'

/** Application chrome: sticky nav, routed content, attribution footer. */
export function AppShell() {
  return (
    <div className="flex min-h-dvh flex-col">
      <TopNav />
      <MobileNav />
      <main className="flex-1">
        <Outlet />
      </main>
      <AppFooter />
    </div>
  )
}
