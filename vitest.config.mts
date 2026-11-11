import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    // the first MDX render loads Shiki's grammars; on a loaded machine that passes the 5 s default
    testTimeout: 20_000,
  },
})
