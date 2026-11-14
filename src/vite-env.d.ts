/// <reference types="vite/client" />

// Register jest-dom's vitest matchers (toBeInTheDocument etc.) for the app project so test
// files type-check; the runtime import lives in vitest.setup.ts.
import '@testing-library/jest-dom/vitest'
