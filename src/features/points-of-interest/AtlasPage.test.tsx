import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AtlasPage } from './AtlasPage'

function renderAtlas() {
  return render(
    <MemoryRouter>
      <AtlasPage />
    </MemoryRouter>,
  )
}

describe('AtlasPage (Module D)', () => {
  it('renders the heading and full catalog count', () => {
    renderAtlas()
    expect(screen.getByRole('heading', { name: 'Exploration Atlas' })).toBeInTheDocument()
    expect(screen.getByText('10 / 10 sites')).toBeInTheDocument()
  })

  it('filters by search query', async () => {
    const user = userEvent.setup()
    renderAtlas()
    const input = screen.getByLabelText('Search points of interest')
    await user.type(input, 'watney')
    expect(screen.getByText('1 / 10 sites')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Open details for Ares III Site/i })).toBeInTheDocument()
  })

  it('shows the empty state for unmatched queries', async () => {
    const user = userEvent.setup()
    renderAtlas()
    const input = screen.getByLabelText('Search points of interest')
    await user.type(input, 'xyzzy-not-a-place')
    expect(screen.getByText('No matching sites')).toBeInTheDocument()
  })

  it('opens the detail dialog from a card', async () => {
    const user = userEvent.setup()
    renderAtlas()
    await user.click(screen.getByRole('button', { name: /Open details for Olympus Mons/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    // The coordinate note renders as "Note: <text>" inside one <p>; match unanchored.
    expect(
      screen.getAllByText(/226\.2°E in the 0–360°E convention ≡ 133\.8°W/).length,
    ).toBeGreaterThan(0)
  })
})
