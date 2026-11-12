import { beforeEach, describe, expect, it, vi } from 'vitest'
import { findPost, getCategories, getPost, getPosts } from './index'

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
    await getPosts({ deadline: performance.now() + 1_000 })
    expect(requested()).toEqual({
      url: 'https://api.example.test/api/posts',
      cache: 'no-store',
    })
  })
})

describe('findPost', () => {
  const listed = (...slugs: string[]) => ({
    status: 'success',
    count: slugs.length,
    data: slugs.map((slug, i) => ({
      id: i + 1,
      slug,
      category: 'articles',
      title: slug,
      description: null,
      author: 'Tianwei Zhang',
      createdAt: '2025-10-23T04:00:00.000Z',
      updatedAt: null,
    })),
  })
  const post = (slug: string) => ({
    status: 'success',
    data: {
      ...listed(slug).data[0],
      isPublished: true,
      content: `# ${slug}\n`,
    },
  })

  /** Serves `list` at /api/posts and each post in it; any other post is a 404. */
  function serve(list: ReturnType<typeof listed>) {
    fetchMock.mockImplementation(async (input) => {
      const path = new URL(String(input)).pathname
      if (path === '/api/posts')
        return new Response(JSON.stringify(list))
      const slug = path.slice('/api/post/'.length)
      return list.data.some(entry => entry.slug === slug)
        ? new Response(JSON.stringify(post(slug)))
        : new Response('{"status":"error","message":"Post not found."}', { status: 404 })
    })
  }

  const paths = () => fetchMock.mock.calls.map(([input]) => new URL(String(input)).pathname)

  it('reads a post the list has', async () => {
    serve(listed('alpha'))
    expect(await findPost('alpha')).toMatchObject({ slug: 'alpha', content: '# alpha\n' })
    expect(paths()).toEqual(['/api/posts', '/api/post/alpha'])
  })

  it('answers undefined for a slug the list lacks without asking the API for it, and finds it once the list has it', async () => {
    serve(listed('alpha'))
    expect(await findPost('beta')).toBeUndefined()
    expect(paths()).toEqual(['/api/posts'])

    // beta is published and `posts` expired: the next list read has it
    fetchMock.mockClear()
    serve(listed('beta', 'alpha'))
    expect(await findPost('beta')).toMatchObject({ slug: 'beta' })
    expect(paths()).toEqual(['/api/posts', '/api/post/beta'])
  })

  it('answers undefined for a listed post the API no longer has', async () => {
    fetchMock.mockImplementation(async input => String(input).endsWith('/api/posts')
      ? new Response(JSON.stringify(listed('alpha')))
      : new Response('{"status":"error","message":"Post not found."}', { status: 404 }))
    expect(await findPost('alpha')).toBeUndefined()
  })

  it('throws, rather than answering undefined, when the list cannot be read', async () => {
    fetchMock.mockResolvedValue(new Response('{"status":"error","message":"Bad request"}', { status: 400 }))
    await expect(findPost('alpha')).rejects.toMatchObject({ status: 400 })
  })
})
