import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

/** Last-resort render guard so a crash shows a controlled, branded screen. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // Surfaced to the console for debugging; user sees the controlled screen below.
    console.error('ARES render error:', error, info.componentStack)
  }

  private handleReset = (): void => {
    this.setState({ error: null })
  }

  override render(): ReactNode {
    const { error } = this.state
    if (!error) return this.props.children
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="eyebrow">Signal lost</p>
        <h1 className="font-display text-2xl font-bold tracking-wide text-ink">
          Something went wrong
        </h1>
        <p className="text-sm leading-relaxed text-ink-dim">
          The interface hit an unexpected error. Reloading the module usually resolves it; the
          issue details below help the team diagnose a real fault.
        </p>
        <div className="flex gap-3">
          <Button onClick={this.handleReset}>Try again</Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Reload ARES
          </Button>
        </div>
        <details className="w-full rounded-lg border border-line bg-surface/50 p-4 text-left">
          <summary className="cursor-pointer font-mono text-xs uppercase tracking-wider text-ink-faint">
            Technical details
          </summary>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-ink-dim">
            {error.message}
          </pre>
        </details>
      </div>
    )
  }
}
