import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.stubEnv('CONTENT_API_URL', 'https://api.example.test')

const { cacheTags, getCategories, getPost, getPosts } = await import('./index')

const fetchMock = vi.fn()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

function respond(data: unknown) {
  fetchMock.mockResolvedValue(new Response(JSON.stringify({ status: 'success', count: 0, data }), { status: 200 }))
}

function requested() {
  const [url, init] = fetchMock.mock.calls[0] as [string, { next?: { revalidate?: unknown, tags?: string[] } }]
  return { url, next: init.next }
}

describe('cache tags', () => {
  it('builds post tags and reads the slug back, and nothing else', () => {
    expect(cacheTags.post('hello-world')).toBe('post-hello-world')
    expect(cacheTags.slugOf(cacheTags.post('hello-world'))).toBe('hello-world')
    expect(cacheTags.slugOf(cacheTags.posts)).toBeUndefined()
    expect(cacheTags.slugOf('mystery')).toBeUndefined()
  })
})

describe('endpoints', () => {
  it('caches lists under the posts tag until revalidated', async () => {
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

  it('tags a post with the list tag and its own, and encodes the slug into one path segment', async () => {
    fetchMock.mockResolvedValue(new Response('{"status":"error","message":"Validation failed"}', { status: 400 }))
    await expect(getPost('a?b/c')).rejects.toMatchObject({ status: 400 })
    expect(requested()).toEqual({
      url: 'https://api.example.test/api/post/a%3Fb%2Fc',
      next: {
        revalidate: false,
        tags: ['posts', 'post-a?b/c'],
      },
    })
  })
})
