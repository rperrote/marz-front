import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '#': path.resolve(import.meta.dirname, './src'),
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: false,
    exclude: ['**/node_modules/**', '**/e2e/**', '**/dist/**'],
    env: {
      VITE_API_URL: 'https://api.test',
      VITE_WS_URL: 'ws://localhost:4000',
      VITE_APP_TITLE: 'Marz Test',
    },
  },
})
