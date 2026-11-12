import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { revalidatePosts } from './cache'

const { revalidateTag } = vi.hoisted(() => ({
  revalidateTag: vi.fn(),
}))
vi.mock('next/cache', () => ({ revalidateTag }))

const API = 'https://api.example.test'

function wirePost(slug: string, id: number) {
  return {
    id,
    slug,
    category: 'articles',
    title: slug,
    description: null,
    author: 'Tianwei Zhang',
    createdAt: '2025-10-23T04:00:00.000Z',
    updatedAt: null,
    isPublished: true,
    content: `# ${slug}\n`,
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status })
}

const notFound = () => json({ status: 'error', message: 'Post not found.' }, 404)

type Handler = (path: string, answer: () => Response) => Promise<Response> | Response

/** A content API serving these posts; `handle` sits in front of it and may answer differently. */
function stubApi(slugs: string[], handle: Handler = (_path, answer) => answer()) {
  const posts = slugs.map(wirePost)
  const answerFor = (path: string) => {
    if (path === '/api/posts')
      return json({ status: 'success', count: posts.length, data: posts })
    if (path === '/api/categories') {
      return json({
        status: 'success',
        count: 1,
        data: ['articles'],
      })
    }
    const post = posts.find(candidate => path === `/api/post/${candidate.slug}`)
    return post === undefined
      ? notFound()
      : json({ status: 'success', data: post })
  }
  const api = vi.fn<typeof fetch>(async (input) => {
    const path = new URL(String(input)).pathname
    return handle(path, () => answerFor(path))
  })
  vi.stubGlobal('fetch', api)
  return api
}

function pathsOf(api: ReturnType<typeof stubApi>): string[] {
  return api.mock.calls.map(([input]) => new URL(String(input)).pathname)
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('CONTENT_API_URL', API)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('revalidatePosts', () => {
  it('reads the list, every post and the categories past the cache, then expires the tag', async () => {
    const api = stubApi(['alpha', 'beta'])

    expect(await revalidatePosts()).toEqual({ ok: true })

    expect(pathsOf(api).sort()).toEqual([
      '/api/categories',
      '/api/post/alpha',
      '/api/post/beta',
      '/api/posts',
    ])
    // exactly these options: `next.revalidate` beside `cache: 'no-store'`
    // would make Next drop both
    for (const [, init] of api.mock.calls) {
      const { signal, ...options } = init ?? {}
      expect(options).toStrictEqual({
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      })
      expect(signal).toBeInstanceOf(AbortSignal)
    }
    expect(revalidateTag).toHaveBeenCalledExactlyOnceWith('posts', { expire: 0 })
    expect(revalidateTag.mock.invocationCallOrder[0]).toBeGreaterThan(Math.max(...api.mock.invocationCallOrder))
  })

  it('expires nothing when a post on the list cannot be read, and says which', async () => {
    stubApi(['alpha', 'beta'], (path, answer) => path === '/api/post/beta'
      ? notFound()
      : answer())

    expect(await revalidatePosts()).toEqual({ ok: false, message: 'reading post "beta": Post not found.' })
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('expires nothing when the list does not parse', async () => {
    stubApi(['alpha'], (path, answer) => path === '/api/posts'
      ? json({ status: 'success', data: [] })
      : answer())

    expect(await revalidatePosts()).toMatchObject({ ok: false })
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('keeps at most four reads in flight, categories included, and starts none after a failure', async () => {
    let inFlight = 0
    let mostInFlight = 0
    const slugs = Array.from({ length: 9 }, (_, i) => `post-${i + 1}`)
    const api = stubApi(slugs, async (path, answer) => {
      if (path === '/api/posts')
        return answer()
      inFlight++
      mostInFlight = Math.max(mostInFlight, inFlight)
      await new Promise(resolve => setTimeout(resolve, 20))
      inFlight--
      return path === '/api/post/post-3'
        ? notFound()
        : answer()
    })

    expect(await revalidatePosts()).toMatchObject({ ok: false, message: 'reading post "post-3": Post not found.' })
    expect(mostInFlight).toBe(4)
    // every request it started had ended, and the rest never started
    expect(inFlight).toBe(0)
    expect(api.mock.calls.length).toBeLessThan(1 + 1 + slugs.length)
    expect(revalidateTag).not.toHaveBeenCalled()
  })
})
