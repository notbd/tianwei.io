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

type Handler = (path: string, init: RequestInit, answer: () => Response) => Promise<Response> | Response

/** A content API serving these posts; `handle` sits in front of it and may answer differently. */
function stubApi(slugs: string[], handle: Handler = (_path, _init, answer) => answer()) {
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
  const api = vi.fn<typeof fetch>(async (input, init = {}) => {
    const path = new URL(String(input)).pathname
    return handle(path, init, () => answerFor(path))
  })
  vi.stubGlobal('fetch', api)
  return api
}

/** A response that never comes: the request only ends when its signal aborts. */
async function hang(init: RequestInit): Promise<Response> {
  return new Promise((_resolve, reject) => {
    init.signal?.addEventListener('abort', () => reject(init.signal?.reason))
  })
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
    stubApi(['alpha', 'beta'], (path, _init, answer) => path === '/api/post/beta'
      ? notFound()
      : answer())

    expect(await revalidatePosts()).toEqual({ ok: false, message: 'reading post "beta": Post not found.' })
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('expires nothing when the list does not parse', async () => {
    stubApi(['alpha'], (path, _init, answer) => path === '/api/posts'
      ? json({ status: 'success', data: [] })
      : answer())

    expect(await revalidatePosts()).toMatchObject({ ok: false })
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('keeps at most four reads in flight, categories included, and starts none after a failure', async () => {
    let inFlight = 0
    let mostInFlight = 0
    const slugs = Array.from({ length: 9 }, (_, i) => `post-${i + 1}`)
    const api = stubApi(slugs, async (path, _init, answer) => {
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

  it.each(['/api/posts', '/api/post/beta', '/api/categories'])('gives up when %s outlasts the budget, expiring nothing and starting no request after', async (slowPath) => {
    const api = stubApi(['alpha', 'beta'], async (path, init, answer) => path === slowPath
      ? hang(init)
      : answer())

    expect(await revalidatePosts({ budgetMs: 100 })).toEqual({ ok: false, message: 'reading the content API took longer than 100 ms' })
    expect(revalidateTag).not.toHaveBeenCalled()

    // longer than the fetcher's waits between retries
    const requests = api.mock.calls.length
    await new Promise(resolve => setTimeout(resolve, 1000))
    expect(api.mock.calls.length).toBe(requests)
  })
})

// The budget on the clock alone. The clock is fake and only the API stub
// moves it, so each row is exact; it moves performance.now() and the wait
// before a retry together. AbortSignal.timeout is not faked and never
// fires here, so nothing below is the timers' doing.
describe('revalidatePosts, with the budget running out between requests', () => {
  const BUDGET_MS = 1_000
  const OUT_OF_TIME = { ok: false, message: 'reading the content API took longer than 1000 ms' }

  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ['performance', 'setTimeout'],
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  /** The outcome of a run in which each request takes `cost(path)` ms on the clock. */
  async function runWith(slugs: string[], handle: Handler) {
    const api = stubApi(slugs, handle)
    const outcome = revalidatePosts({ budgetMs: BUDGET_MS })
    await vi.runAllTimersAsync()
    return { api, result: await outcome }
  }

  /** `respond`, after `ms` on the clock. */
  const taking = (ms: number, respond: () => Response) => {
    vi.advanceTimersByTime(ms)
    return respond()
  }

  it('expires nothing when the last read ends exactly at the deadline', async () => {
    const { api, result } = await runWith(['alpha'], (path, _init, answer) => taking(path === '/api/categories'
      ? 0
      : 500, answer))

    expect(result).toEqual(OUT_OF_TIME)
    expect(pathsOf(api)).toEqual(['/api/posts', '/api/categories', '/api/post/alpha'])
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('requests no post once the list has used the budget up', async () => {
    const { api, result } = await runWith(['alpha', 'beta'], (_path, _init, answer) => taking(BUDGET_MS, answer))

    expect(result).toEqual(OUT_OF_TIME)
    expect(pathsOf(api)).toEqual(['/api/posts'])
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('requests nothing more once one read has used the budget up, and waits for the reads in flight', async () => {
    let inFlight = 0
    const slugs = Array.from({ length: 9 }, (_, i) => `post-${i + 1}`)
    const { api, result } = await runWith(slugs, async (path, _init, answer) => {
      if (path === '/api/posts')
        return answer()
      inFlight++
      // the four that start together are all in flight before any ends
      await Promise.resolve()
      inFlight--
      return taking(path === '/api/post/post-1'
        ? BUDGET_MS
        : 0, answer)
    })

    expect(result).toEqual(OUT_OF_TIME)
    expect(pathsOf(api)).toEqual([
      '/api/posts',
      '/api/categories',
      '/api/post/post-1',
      '/api/post/post-2',
      '/api/post/post-3',
    ])
    expect(inFlight).toBe(0)
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it.each([
    [
      'a 5xx',
      () => new Response('oops', { status: 503 }),
    ],
    [
      'a 2xx that is not JSON',
      () => new Response('<html>gateway error</html>'),
    ],
    [
      'a network error',
      () => {
        throw new TypeError('fetch failed')
      },
    ],
  ])('does not retry %s once the budget is used up', async (_name, fail) => {
    const { api, result } = await runWith(['alpha'], () => taking(BUDGET_MS, fail))

    expect(result).toEqual(OUT_OF_TIME)
    expect(pathsOf(api)).toEqual(['/api/posts'])
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('sends no second request when the deadline passes during the wait before the retry', async () => {
    // 200 ms are left after the failure; the wait before a retry is 300 ms
    const { api, result } = await runWith(['alpha'], () => taking(BUDGET_MS - 200, () => new Response('oops', { status: 503 })))

    expect(result).toEqual(OUT_OF_TIME)
    expect(pathsOf(api)).toEqual(['/api/posts'])
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('retries within the budget, and expires the tag when the retry reads', async () => {
    let listAnswers = 0
    const { api, result } = await runWith(['alpha'], (path, _init, answer) => path === '/api/posts' && listAnswers++ === 0
      ? taking(100, () => new Response('oops', { status: 503 }))
      : answer())

    expect(result).toEqual({ ok: true })
    expect(pathsOf(api)).toEqual([
      '/api/posts',
      '/api/posts',
      '/api/categories',
      '/api/post/alpha',
    ])
    expect(revalidateTag).toHaveBeenCalledOnce()
  })
})
