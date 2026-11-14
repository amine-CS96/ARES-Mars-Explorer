import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// Vitest runs with globals disabled; RTL auto-cleanup therefore needs an explicit hook.
afterEach(() => {
  cleanup()
})
