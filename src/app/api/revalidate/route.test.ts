import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from './route'

const { revalidatePosts } = vi.hoisted(() => ({
  revalidatePosts: vi.fn(),
}))
vi.mock('@/lib/cache', () => ({ revalidatePosts }))

const SECRET = 'test-secret'

function makeRequest(body: unknown, auth?: string): NextRequest {
  return new NextRequest('https://tianwei.io/api/revalidate', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(auth !== undefined && { authorization: auth }),
    },
    body: typeof body === 'string'
      ? body
      : JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('REVALIDATION_SECRET', SECRET)
  revalidatePosts.mockResolvedValue({ ok: true })
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
    expect(revalidatePosts).not.toHaveBeenCalled()
  })

  it('401s with a wrong bearer token', async () => {
    const res = await POST(makeRequest({
      tags: ['posts'],
    }, 'Bearer wrong'))
    expect(res.status).toBe(401)
    expect(revalidatePosts).not.toHaveBeenCalled()
  })

  it('fails CLOSED when REVALIDATION_SECRET is unset', async () => {
    // regression: interpolating an unset env var made the expected header
    // the literal "Bearer undefined", which an attacker can just send
    vi.stubEnv('REVALIDATION_SECRET', '')
    const res = await POST(makeRequest({
      tags: ['posts'],
    }, 'Bearer undefined'))
    expect(res.status).toBe(401)
    expect(revalidatePosts).not.toHaveBeenCalled()
  })
})

describe('/api/revalidate', () => {
  it('200s with the expired tag once the API read succeeded', async () => {
    const res = await POST(makeRequest({
      tags: ['posts'],
    }, `Bearer ${SECRET}`))
    expect(res.status).toBe(200)
    // `success` is what the 2026-07 content engine checks
    expect(await res.json()).toEqual({
      success: true,
      revalidated: ['posts'],
    })
    expect(revalidatePosts).toHaveBeenCalledOnce()
  })

  it('502s, saying why, when the API read failed and nothing was expired', async () => {
    revalidatePosts.mockResolvedValue({ ok: false, message: 'reading post "alpha": Request failed (500)' })
    const res = await POST(makeRequest({
      tags: ['posts'],
    }, `Bearer ${SECRET}`))
    expect(res.status).toBe(502)
    expect(await res.json()).toEqual({
      error: 'Could not read the content API; nothing was revalidated',
      message: 'reading post "alpha": Request failed (500)',
    })
  })

  it.each([
    ['an empty object', {}],
    [
      'no tags',
      { tags: [] },
    ],
    [
      'another tag',
      {
        tags: ['other'],
      },
    ],
    [
      'a post tag beside posts',
      {
        tags: ['posts', 'post-a'],
      },
    ],
    [
      'the retired { slug }',
      { slug: 'x' },
    ],
    [
      'the retired { tag }',
      { tag: 'posts' },
    ],
    [
      'an extra key',
      {
        tags: ['posts'],
        slug: 'x',
      },
    ],
    ['invalid JSON', 'not json{'],
  ])('400s on %s and touches nothing', async (_name, body) => {
    const res = await POST(makeRequest(body, `Bearer ${SECRET}`))
    expect(res.status).toBe(400)
    expect(revalidatePosts).not.toHaveBeenCalled()
  })
})
