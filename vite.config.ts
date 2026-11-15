/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Vendor split keeps app chunks small and library chunks cacheable between releases.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) {
            return 'vendor-react'
          }
          if (/[\\/]node_modules[\\/](three|three-stdlib|@react-three)[\\/]/.test(id)) {
            return 'vendor-three'
          }
          if (/[\\/]node_modules[\\/]@tanstack[\\/]react-query[\\/]/.test(id)) return 'vendor-query'
          if (/[\\/]node_modules[\\/]zod[\\/]/.test(id)) return 'vendor-zod'
          // Consolidate all remaining libraries into the UI chunk to avoid circular chunk
          // references at runtime (some UI libs and chart libs cross-import each other).
          return 'vendor-ui'
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
  },
})
