import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// paths.ts reads VERCEL_ENV / VERCEL_URL at import time, so modules are
// reset and dynamically imported after the env stubs are in place.

beforeEach(() => {
  vi.resetModules()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('canonical base URL (BasePaths.url)', () => {
  it.each([
    // regression: VERCEL_URL is the *.vercel.app deployment URL even in
    // production, which once put the wrong host in the sitemap, feed and og:url
    { env: 'production', url: 'tianwei-io-abc123.vercel.app', expected: 'https://tianwei.io' },
    { env: 'preview', url: 'tianwei-io-git-dev.vercel.app', expected: 'https://tianwei-io-git-dev.vercel.app' },
    { env: undefined, url: undefined, expected: 'https://tianwei.io' },
  ])('is $expected with VERCEL_ENV=$env and VERCEL_URL=$url', async ({ env, url, expected }) => {
    vi.stubEnv('VERCEL_ENV', env)
    vi.stubEnv('VERCEL_URL', url)
    const { BasePaths } = await import('./paths')
    expect(BasePaths.url).toBe(expected)
  })
})

describe('route paths', () => {
  it('builds post and category paths, percent-encoding the category', async () => {
    const { categoryPath, postPath } = await import('./paths')
    expect(postPath('hello-world')).toBe('/posts/hello-world')
    expect(categoryPath('articles')).toBe('/categories/articles')
    expect(categoryPath('dev notes')).toBe('/categories/dev%20notes')
  })
})
