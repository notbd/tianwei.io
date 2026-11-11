import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { ApiError, fetchList, fetchOne, isNotFoundError } from './fetcher'

const itemSchema = z.object({
  id: z.number(),
})

function stubFetch(response: { status?: number, json?: unknown }) {
  const { status = 200, json = {} } = response
  const fetchMock = vi.fn<typeof fetch>(async () => new Response(JSON.stringify(json), { status }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function successBody(data: unknown): Response {
  return new Response(JSON.stringify({ status: 'success', data }), { status: 200 })
}

beforeEach(() => {
  vi.stubEnv('CONTENT_API_URL', 'https://api.example.test')
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('configuration', () => {
  it.each([undefined, ''])('fails loudly, without a request, when CONTENT_API_URL is %j', async (value) => {
    // regression: an unset value used to surface as a relative-URL fetch
    // that HANGS `next build` instead of failing
    vi.stubEnv('CONTENT_API_URL', value)
    const fetchMock = stubFetch({})
    await expect(fetchOne('/api/thing', itemSchema)).rejects.toThrow(/CONTENT_API_URL is not set/)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('isNotFoundError', () => {
  it('matches the API 404 and the 400 it sends for a malformed slug', async () => {
    expect(isNotFoundError(new ApiError(404, 'Post not found.'))).toBe(true)
    expect(isNotFoundError(new ApiError(400, 'Validation failed: slug - ...'))).toBe(true)
  })

  it('leaves every other failure to propagate', async () => {
    expect(isNotFoundError(new ApiError(500, 'Request failed (500)'))).toBe(false)
    expect(isNotFoundError(new ApiError(401, 'Unauthorized'))).toBe(false)
    expect(isNotFoundError(new TypeError('fetch failed'))).toBe(false)
  })
})

describe('fetchOne', () => {
  it('returns data from a success envelope', async () => {
    stubFetch({
      json: {
        status: 'success',
        data: { id: 7 },
      },
    })
    expect(await fetchOne('/api/thing', itemSchema)).toEqual({ id: 7 })
  })

  it('requests CONTENT_API_URL + path, asking for JSON', async () => {
    const fetchMock = stubFetch({
      json: {
        status: 'success',
        data: { id: 1 },
      },
    })
    await fetchOne('/api/thing', itemSchema)
    const [url, init] = fetchMock.mock.calls[0] ?? []
    expect(url).toBe('https://api.example.test/api/thing')
    expect(init?.headers).toEqual({ Accept: 'application/json' })
    expect(init?.signal).toBeInstanceOf(AbortSignal)
  })

  it('sends every attempt with its own signal, which opts the retry out of Next\'s render memoization', async () => {
    const fetchMock = stubFetch({ status: 503 })
    await expect(fetchOne('/api/thing', itemSchema)).rejects.toMatchObject({ status: 503 })
    const signals = fetchMock.mock.calls.map(([, init]) => init?.signal)
    expect(new Set(signals).size).toBe(3)
  })

  it('throws ApiError with status after exhausting retries on 5xx', async () => {
    const fetchMock = stubFetch({ status: 500 })

    const failure = fetchOne('/api/thing', itemSchema)
    await expect(failure).rejects.toBeInstanceOf(ApiError)
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('gives each attempt a deadline and retries one that times out', async () => {
    // a hung API must fail the build or render, never stall it
    const timeout = vi.spyOn(AbortSignal, 'timeout')
    const fetchMock = vi.fn<typeof fetch>()
      .mockRejectedValueOnce(new DOMException('The operation was aborted due to timeout', 'TimeoutError'))
      .mockResolvedValueOnce(successBody({ id: 4 }))
    vi.stubGlobal('fetch', fetchMock)

    expect(await fetchOne('/api/thing', itemSchema)).toEqual({ id: 4 })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(timeout).toHaveBeenCalledWith(10_000)
    timeout.mockRestore()
  })

  it('joins the caller\'s signal to each attempt and retries nothing once it fires', async () => {
    const caller = new AbortController()
    const fetchMock = vi.fn<typeof fetch>(async (_url, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(init.signal?.reason))
      caller.abort(new Error('deadline'))
    }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchOne('/api/thing', itemSchema, { signal: caller.signal })).rejects.toThrow('deadline')
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('cuts the wait before a retry short when the caller\'s signal fires', async () => {
    const caller = new AbortController()
    const fetchMock = vi.fn<typeof fetch>(async () => {
      setTimeout(() => caller.abort(), 20)
      return new Response('oops', { status: 503 })
    })
    vi.stubGlobal('fetch', fetchMock)

    const started = performance.now()
    await expect(fetchOne('/api/thing', itemSchema, { signal: caller.signal })).rejects.toThrow()
    // the first backoff is 300 ms
    expect(performance.now() - started).toBeLessThan(250)
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('starts no request once the caller\'s signal has fired', async () => {
    const fetchMock = stubFetch({})
    await expect(fetchOne('/api/thing', itemSchema, {
      signal: AbortSignal.abort(),
    })).rejects.toThrow()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('recovers from a transient 5xx (build-time flake protection)', async () => {
    const responses = [
      new Response('oops', { status: 503 }),
      successBody({ id: 9 }),
    ]
    const fetchMock = vi.fn(async () => responses.shift()!)
    vi.stubGlobal('fetch', fetchMock)

    expect(await fetchOne('/api/thing', itemSchema)).toEqual({ id: 9 })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('recovers from a thrown network error', async () => {
    let first = true
    const fetchMock = vi.fn(async () => {
      if (first) {
        first = false
        throw new TypeError('fetch failed')
      }
      return successBody({ id: 3 })
    })
    vi.stubGlobal('fetch', fetchMock)

    expect(await fetchOne('/api/thing', itemSchema)).toEqual({ id: 3 })
  })

  it('retries a 2xx with a non-JSON body (CDN error page) and recovers', async () => {
    const responses = [
      new Response('<html>gateway error</html>', { status: 200 }),
      successBody({ id: 5 }),
    ]
    const fetchMock = vi.fn(async () => responses.shift()!)
    vi.stubGlobal('fetch', fetchMock)

    expect(await fetchOne('/api/thing', itemSchema)).toEqual({ id: 5 })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('surfaces a descriptive error when every body is non-JSON', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<html>oops</html>', { status: 200 })))

    await expect(fetchOne('/api/thing', itemSchema)).rejects.toThrow(/Invalid JSON from/)
  })

  it('does NOT retry 4xx (a retried 404 would delay a legitimate notFound)', async () => {
    const fetchMock = stubFetch({ status: 404 })

    await expect(fetchOne('/api/thing', itemSchema)).rejects.toMatchObject({ status: 404 })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('surfaces the API message and the real status from an error envelope', async () => {
    stubFetch({
      status: 404,
      json: { status: 'error', message: 'Post not found.' },
    })
    await expect(fetchOne('/api/thing', itemSchema)).rejects.toMatchObject({
      status: 404,
      message: 'Post not found.',
    })
  })

  it('falls back to the status code when the body is not an error envelope', async () => {
    // not statusText: an HTTP/2 response has none
    stubFetch({
      status: 404,
      json: 'not an envelope',
    })
    await expect(fetchOne('/api/thing', itemSchema)).rejects.toMatchObject({
      status: 404,
      message: 'Request failed (404)',
    })
  })

  it('throws a ZodError on a malformed envelope', async () => {
    stubFetch({
      json: {
        status: 'success',
        data: { id: 'not-a-number' },
      },
    })
    await expect(fetchOne('/api/thing', itemSchema)).rejects.toThrow(z.ZodError)
  })
})

describe('fetchList', () => {
  it('returns the data array from a success list envelope', async () => {
    stubFetch({
      json: {
        status: 'success',
        count: 2,
        data: [
          { id: 1 },
          { id: 2 },
        ],
      },
    })
    expect(await fetchList('/api/things', itemSchema)).toEqual([
      { id: 1 },
      { id: 2 },
    ])
  })

  it('rejects an envelope missing count', async () => {
    stubFetch({
      json: { status: 'success', data: [] },
    })
    await expect(fetchList('/api/things', itemSchema)).rejects.toThrow(z.ZodError)
  })
})
