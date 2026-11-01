import type { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const revalidateAndWarmTags = vi.fn()

vi.mock('@/lib/cache', () => ({ revalidateAndWarmTags }))

// the route reads cacheTags from @/lib/api, whose fetcher needs this at import
vi.stubEnv('CONTENT_API_URL', 'https://api.example.test')

const { POST } = await import('./route')

const SECRET = 'test-secret'

function makeRequest(body: unknown, auth?: string): NextRequest {
  return new Request('https://tianwei.io/api/revalidate', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(auth !== undefined && { authorization: auth }),
    },
    body: typeof body === 'string'
      ? body
      : JSON.stringify(body),
  }) as unknown as NextRequest
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('REVALIDATION_SECRET', SECRET)
  revalidateAndWarmTags.mockResolvedValue({
    success: true,
    revalidated: ['posts'],
    warmed: ['posts'],
  })
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('/api/revalidate auth', () => {
  it('401s without an authorization header and touches nothing', async () => {
    const res = await POST(makeRequest({
      tags: ['posts'],
    }))
    expect(res.status).toBe(401)
    expect(revalidateAndWarmTags).not.toHaveBeenCalled()
  })

  it('401s with a wrong bearer token', async () => {
    const res = await POST(makeRequest({
      tags: ['posts'],
    }, 'Bearer wrong'))
    expect(res.status).toBe(401)
    expect(revalidateAndWarmTags).not.toHaveBeenCalled()
  })

  it('fails CLOSED when REVALIDATION_SECRET is unset', async () => {
    // regression: interpolating an unset env var made the expected header
    // the literal "Bearer undefined" — which an attacker can just send
    vi.stubEnv('REVALIDATION_SECRET', '')
    const res = await POST(makeRequest({
      tags: ['posts'],
    }, 'Bearer undefined'))
    expect(res.status).toBe(401)
    expect(revalidateAndWarmTags).not.toHaveBeenCalled()
  })
})

describe('/api/revalidate payloads', () => {
  it('handles { slug } as the post tag plus the list tag', async () => {
    const res = await POST(makeRequest({ slug: 'hello' }, `Bearer ${SECRET}`))
    expect(res.status).toBe(200)
    expect(revalidateAndWarmTags).toHaveBeenCalledWith(['post-hello', 'posts'])
  })

  it('handles { tags: [...] }', async () => {
    const res = await POST(makeRequest({
      tags: ['posts', 'post-a'],
    }, `Bearer ${SECRET}`))
    expect(res.status).toBe(200)
    expect(revalidateAndWarmTags).toHaveBeenCalledWith(['posts', 'post-a'])
  })

  it('handles { tag } as a single-tag list', async () => {
    const res = await POST(makeRequest({ tag: 'posts' }, `Bearer ${SECRET}`))
    expect(res.status).toBe(200)
    expect(revalidateAndWarmTags).toHaveBeenCalledWith(['posts'])
  })

  it('400s when no tag, tags, or slug is provided, or tags is empty', async () => {
    expect((await POST(makeRequest({}, `Bearer ${SECRET}`))).status).toBe(400)
    expect((await POST(makeRequest({ tags: [] }, `Bearer ${SECRET}`))).status).toBe(400)
    expect(revalidateAndWarmTags).not.toHaveBeenCalled()
  })

  it('207s on partial warming failure (the CI pipeline keys off this)', async () => {
    revalidateAndWarmTags.mockResolvedValue({
      success: false,
      revalidated: ['posts'],
      warmed: [],
      error: 'warmer exploded',
    })
    const res = await POST(makeRequest({
      tags: ['posts'],
    }, `Bearer ${SECRET}`))
    expect(res.status).toBe(207)
    expect(await res.json()).toMatchObject({ success: false, error: 'warmer exploded' })
  })

  it('400s on an invalid JSON body (a client error, not a server failure)', async () => {
    const res = await POST(makeRequest('not json{', `Bearer ${SECRET}`))
    expect(res.status).toBe(400)
    expect(revalidateAndWarmTags).not.toHaveBeenCalled()
  })

  it('500s when revalidation itself throws (a warming failure is a 207, not this)', async () => {
    revalidateAndWarmTags.mockRejectedValue(new Error('revalidateTag exploded'))
    const res = await POST(makeRequest({
      tags: ['posts'],
    }, `Bearer ${SECRET}`))
    expect(res.status).toBe(500)
    expect(await res.json()).toMatchObject({
      error: 'Internal server error',
      message: 'revalidateTag exploded',
    })
  })
})
