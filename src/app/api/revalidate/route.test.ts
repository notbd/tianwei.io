import type { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const revalidateAndWarmTags = vi.fn()
const revalidateAndWarmPost = vi.fn()

vi.mock('@/lib/cache', () => ({ revalidateAndWarmTags, revalidateAndWarmPost }))

const { POST } = await import('./route')

const SECRET = 'test-secret'

function makeRequest(body: unknown, auth?: string): NextRequest {
  return new Request('https://tianwei.io/api/revalidate', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(auth !== undefined && { authorization: auth }),
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  }) as unknown as NextRequest
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('REVALIDATION_SECRET', SECRET)
  revalidateAndWarmTags.mockResolvedValue({ success: true, revalidated: ['posts'], warmed: ['posts'] })
  revalidateAndWarmPost.mockResolvedValue({ success: true, revalidated: ['post-a', 'posts'], warmed: [] })
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('pOST /api/revalidate auth', () => {
  it('401s without an authorization header and touches nothing', async () => {
    const res = await POST(makeRequest({ tags: ['posts'] }))
    expect(res.status).toBe(401)
    expect(revalidateAndWarmTags).not.toHaveBeenCalled()
  })

  it('401s with a wrong bearer token', async () => {
    const res = await POST(makeRequest({ tags: ['posts'] }, 'Bearer wrong'))
    expect(res.status).toBe(401)
    expect(revalidateAndWarmTags).not.toHaveBeenCalled()
  })
})

describe('pOST /api/revalidate payloads', () => {
  it('handles { slug } via revalidateAndWarmPost', async () => {
    const res = await POST(makeRequest({ slug: 'hello' }, `Bearer ${SECRET}`))
    expect(res.status).toBe(200)
    expect(revalidateAndWarmPost).toHaveBeenCalledWith('hello')
  })

  it('handles { tags: [...] }', async () => {
    const res = await POST(makeRequest({ tags: ['posts', 'post-a'] }, `Bearer ${SECRET}`))
    expect(res.status).toBe(200)
    expect(revalidateAndWarmTags).toHaveBeenCalledWith(['posts', 'post-a'])
  })

  it('handles { tag } as a single-tag list', async () => {
    const res = await POST(makeRequest({ tag: 'posts' }, `Bearer ${SECRET}`))
    expect(res.status).toBe(200)
    expect(revalidateAndWarmTags).toHaveBeenCalledWith(['posts'])
  })

  it('400s when no tag, tags, or slug is provided', async () => {
    const res = await POST(makeRequest({}, `Bearer ${SECRET}`))
    expect(res.status).toBe(400)
  })

  it('207s on partial warming failure (the CI pipeline keys off this)', async () => {
    revalidateAndWarmTags.mockResolvedValue({
      success: false,
      revalidated: ['posts'],
      warmed: [],
      error: 'warmer exploded',
    })
    const res = await POST(makeRequest({ tags: ['posts'] }, `Bearer ${SECRET}`))
    expect(res.status).toBe(207)
    expect(await res.json()).toMatchObject({ success: false, error: 'warmer exploded' })
  })

  it('500s on an invalid JSON body', async () => {
    const res = await POST(makeRequest('not json{', `Bearer ${SECRET}`))
    expect(res.status).toBe(500)
  })
})
