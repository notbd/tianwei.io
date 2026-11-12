import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from './route'

const enable = vi.fn()
const disable = vi.fn()

vi.mock('next/headers', () => ({
  draftMode: async () => ({ enable, disable }),
}))

// after() has no request context in unit tests, so run callbacks inline
vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>()
  return {
    ...actual,
    after: (task: () => unknown) => {
      void task()
    },
  }
})

const SECRET = 'a-preview-secret-of-sufficient-length'

function makeRequest(params: Record<string, string>): NextRequest {
  return new NextRequest(`https://tianwei.io/api/preview?${new URLSearchParams(params)}`)
}

const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }))

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('PREVIEW_SECRET', SECRET)
  vi.stubEnv('CONTENT_API_URL', 'https://api.example.test')
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('/api/preview', () => {
  it.each([
    ['a wrong secret', SECRET, 'wrong'],
    ['PREVIEW_SECRET unset (feature disabled)', '', ''],
  ])('401s on %s, enabling nothing and waking nothing', async (_name, configured, given) => {
    vi.stubEnv('PREVIEW_SECRET', configured)
    const res = await GET(makeRequest({ secret: given, slug: 'a-post' }))
    expect(res.status).toBe(401)
    expect(enable).not.toHaveBeenCalled()
    // no public lever to wake the database
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('400s without a slug', async () => {
    const res = await GET(makeRequest({ secret: SECRET }))
    expect(res.status).toBe(400)
    expect(enable).not.toHaveBeenCalled()
  })

  it('enables draft mode, redirects to the post and wakes the database (ADR-0005)', async () => {
    const res = await GET(makeRequest({ secret: SECRET, slug: 'my-draft' }))
    expect(enable).toHaveBeenCalledOnce()
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('https://tianwei.io/posts/my-draft')
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/categories',
      expect.objectContaining({ cache: 'no-store' }),
    )
  })
})
