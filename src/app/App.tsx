import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { AppRoutes } from './routes'

/** Scroll restoration on route change + the routed app shell. */
export function App() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])

  return <AppRoutes />
}
