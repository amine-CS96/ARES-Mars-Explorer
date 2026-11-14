import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './button'

describe('Button', () => {
  it('renders its label and fires clicks', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Launch</Button>)
    const button = screen.getByRole('button', { name: 'Launch' })
    await user.click(button)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('applies the destructive variant classes', () => {
    render(<Button variant="destructive">Abort</Button>)
    const button = screen.getByRole('button', { name: 'Abort' })
    expect(button.className).toContain('text-danger')
  })

  it('renders as a link when asChild is used', () => {
    render(
      <Button asChild>
        <a href="/atlas">Open atlas</a>
      </Button>,
    )
    const link = screen.getByRole('link', { name: 'Open atlas' })
    expect(link.getAttribute('href')).toBe('/atlas')
    expect(link.className).toContain('bg-accent')
  })
})
