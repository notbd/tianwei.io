import { defineConfig } from '@playwright/test'

const isCI = process.env.CI !== undefined && process.env.CI !== ''

/**
 * Browser smoke tests against the production build (`next start`).
 * Run `pnpm build` first; CI wires this after its build step.
 */
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  use: {
    baseURL: 'http://127.0.0.1:3000',
  },
  webServer: {
    command: 'pnpm start',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !isCI,
    timeout: 30_000,
  },
})
