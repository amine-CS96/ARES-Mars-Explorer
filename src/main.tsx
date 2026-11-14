import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/globals.css'
import { Providers } from '@/app/providers'
import { App } from '@/app/App'
import { ErrorBoundary } from '@/components/layout/ErrorBoundary'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('ARES bootstrap failed: #root element missing')
}

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <Providers>
        <App />
      </Providers>
    </ErrorBoundary>
  </StrictMode>,
)
