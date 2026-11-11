import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getCategories, getPost, getPosts } from './index'

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  vi.stubEnv('CONTENT_API_URL', 'https://api.example.test')
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

function respond(data: unknown) {
  fetchMock.mockResolvedValue(new Response(JSON.stringify({ status: 'success', count: 0, data }), { status: 200 }))
}

function requested() {
  const [url, init] = fetchMock.mock.calls[0] ?? []
  return { url, next: init?.next, cache: init?.cache }
}

describe('endpoints', () => {
  it('caches lists under the posts tag until it is expired', async () => {
    respond([])
    await getPosts()
    expect(requested()).toEqual({
      url: 'https://api.example.test/api/posts',
      next: {
        revalidate: false,
        tags: ['posts'],
      },
    })

    fetchMock.mockClear()
    respond([])
    await getCategories()
    expect(requested()).toEqual({
      url: 'https://api.example.test/api/categories',
      next: {
        revalidate: false,
        tags: ['posts'],
      },
    })
  })

  it('caches a post under the same tag, and encodes the slug into one path segment', async () => {
    fetchMock.mockResolvedValue(new Response('{"status":"error","message":"Validation failed"}', { status: 400 }))
    await expect(getPost('a?b/c')).rejects.toMatchObject({ status: 400 })
    expect(requested()).toEqual({
      url: 'https://api.example.test/api/post/a%3Fb%2Fc',
      next: {
        revalidate: false,
        tags: ['posts'],
      },
    })
  })

  it('reads past the cache with plain no-store when given a deadline', async () => {
    respond([])
    await getPosts({ signal: new AbortController().signal })
    expect(requested()).toEqual({
      url: 'https://api.example.test/api/posts',
      cache: 'no-store',
    })
  })
})
