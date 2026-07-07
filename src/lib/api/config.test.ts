import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

beforeEach(() => {
  vi.resetModules()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('config', () => {
  it('exposes BASE_URL when CONTENT_API_URL is set', async () => {
    vi.stubEnv('CONTENT_API_URL', 'https://api.example.test')
    const { BASE_URL } = await import('./config')
    expect(BASE_URL).toBe('https://api.example.test')
  })

  it.each([undefined, ''])('throws loudly when CONTENT_API_URL is %j', async (value) => {
    // regression: an unset value used to surface as a relative-URL fetch
    // that HANGS `next build` instead of failing
    if (value === undefined)
      vi.stubEnv('CONTENT_API_URL', undefined as unknown as string)
    else
      vi.stubEnv('CONTENT_API_URL', value)

    await expect(import('./config')).rejects.toThrow(/CONTENT_API_URL is not set/)
  })
})
