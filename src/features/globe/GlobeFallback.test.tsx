import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MOLA_COLOR_HILLSHADE, buildTrekTileUrl } from '@/services/nasa/marsTrekProvider'
import { GlobeFallback } from './GlobeFallback'

/**
 * The fallback is the honest failure surface — it must always show real, live-verified MOLA
 * tiles and a clear explanation. It imports no three.js, so it is testable in jsdom.
 */
describe('GlobeFallback', () => {
  it('explains the WebGL-unavailable case and shows the live MOLA zoom-0 tiles', () => {
    const { container } = render(<GlobeFallback reason="no-webgl" />)
    expect(
      screen.getByText('3D view unavailable — WebGL not supported'),
    ).toBeInTheDocument()
    // alt="" images are presentational (no img role) — query the elements directly.
    const imgs = [...container.querySelectorAll('img')]
    expect(imgs).toHaveLength(2)
    expect(imgs[0]).toHaveAttribute(
      'src',
      buildTrekTileUrl(MOLA_COLOR_HILLSHADE, { z: 0, x: 0, y: 0 }),
    )
    expect(imgs[1]).toHaveAttribute(
      'src',
      buildTrekTileUrl(MOLA_COLOR_HILLSHADE, { z: 0, x: 1, y: 0 }),
    )
  })

  it('offers a retry for data-unavailable', () => {
    const onRetry = vi.fn()
    render(<GlobeFallback reason="data-unavailable" onRetry={onRetry} />)
    expect(screen.getByText('Mosaic data unavailable right now')).toBeInTheDocument()
    screen.getByRole('button', { name: /retry/i }).click()
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('does not offer retry when the failure is WebGL-side', () => {
    render(<GlobeFallback reason="webgl-error" />)
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument()
  })
})
