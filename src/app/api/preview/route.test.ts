import type { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const enable = vi.fn()
const disable = vi.fn()

vi.mock('next/headers', () => ({
  draftMode: async () => ({ enable, disable }),
}))

// after() has no request context in unit tests — run callbacks inline
vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>()
  return {
    ...actual,
    after: (task: () => unknown) => {
      void task()
    },
  }
})

// route imports the API config, which requires this at module load
vi.stubEnv('CONTENT_API_URL', 'https://api.example.test')

const { GET } = await import('./route')

const SECRET = 'a-preview-secret-of-sufficient-length'

function makeRequest(params: Record<string, string>): NextRequest {
  const url = new URL('https://tianwei.io/api/preview')
  for (const [key, value] of Object.entries(params))
    url.searchParams.set(key, value)
  const request = new Request(url)
  return Object.assign(request, { nextUrl: url }) as unknown as NextRequest
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

describe('gET /api/preview', () => {
  it('401s with a wrong secret and never enables draft mode', async () => {
    const res = await GET(makeRequest({ secret: 'wrong', slug: 'a-post' }))
    expect(res.status).toBe(401)
    expect(enable).not.toHaveBeenCalled()
  })

  it('401s when PREVIEW_SECRET is unset (feature disabled)', async () => {
    vi.stubEnv('PREVIEW_SECRET', '')
    const res = await GET(makeRequest({ secret: '', slug: 'a-post' }))
    expect(res.status).toBe(401)
    expect(enable).not.toHaveBeenCalled()
  })

  it('400s without a slug', async () => {
    const res = await GET(makeRequest({ secret: SECRET }))
    expect(res.status).toBe(400)
    expect(enable).not.toHaveBeenCalled()
  })

  it('enables draft mode and redirects to the post', async () => {
    const res = await GET(makeRequest({ secret: SECRET, slug: 'my-draft' }))
    expect(enable).toHaveBeenCalledOnce()
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('https://tianwei.io/posts/my-draft')
  })

  it('fires a best-effort DB pre-warm after successful auth (ADR-0005)', async () => {
    await GET(makeRequest({ secret: SECRET, slug: 'my-draft' }))
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/categories',
      expect.objectContaining({ cache: 'no-store' }),
    )
  })

  it('never warms the DB for unauthenticated requests (no public wake lever)', async () => {
    await GET(makeRequest({ secret: 'wrong', slug: 'my-draft' }))
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
