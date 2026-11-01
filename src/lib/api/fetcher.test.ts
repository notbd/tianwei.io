import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

// config.ts reads CONTENT_API_URL at import time, so modules are reset and
// dynamically imported after the env stub is in place.

const itemSchema = z.object({
  id: z.number(),
})

function stubFetch(response: { status?: number, statusText?: string, json?: unknown }) {
  const { status = 200, statusText = 'OK', json = {} } = response
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(json), { status, statusText }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

async function importFetcher() {
  return import('./fetcher')
}

function successBody(data: unknown): Response {
  return new Response(JSON.stringify({ status: 'success', data }), { status: 200 })
}

beforeEach(() => {
  vi.resetModules()
  vi.stubEnv('CONTENT_API_URL', 'https://api.example.test')
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('configuration', () => {
  it('builds API URLs from CONTENT_API_URL', async () => {
    const { apiUrl } = await importFetcher()
    expect(apiUrl('/api/posts')).toBe('https://api.example.test/api/posts')
  })

  it.each([undefined, ''])('fails loudly, without a request, when CONTENT_API_URL is %j', async (value) => {
    // regression: an unset value used to surface as a relative-URL fetch
    // that HANGS `next build` instead of failing
    vi.stubEnv('CONTENT_API_URL', value)
    const fetchMock = stubFetch({})
    const { fetchOne } = await importFetcher()
    await expect(fetchOne('/api/thing', itemSchema)).rejects.toThrow(/CONTENT_API_URL is not set/)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('isNotFoundError', () => {
  it('matches the API 404 and the 400 it sends for a malformed slug', async () => {
    const { ApiError, isNotFoundError } = await importFetcher()
    expect(isNotFoundError(new ApiError(404, 'Post not found.'))).toBe(true)
    expect(isNotFoundError(new ApiError(400, 'Validation failed: slug - ...'))).toBe(true)
  })

  it('leaves every other failure to propagate', async () => {
    const { ApiError, isNotFoundError } = await importFetcher()
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
    const { fetchOne } = await importFetcher()
    expect(await fetchOne('/api/thing', itemSchema)).toEqual({ id: 7 })
  })

  it('requests BASE_URL + endpoint', async () => {
    const fetchMock = stubFetch({
      json: {
        status: 'success',
        data: { id: 1 },
      },
    })
    const { fetchOne } = await importFetcher()
    await fetchOne('/api/thing', itemSchema)
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/thing',
      expect.objectContaining({
        headers: { Accept: 'application/json' },
      }),
    )
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(init.signal).toBeInstanceOf(AbortSignal)
  })

  it('sends every attempt with its own signal, which opts the retry out of Next\'s render memoization', async () => {
    const fetchMock = stubFetch({ status: 503 })
    const { fetchOne } = await importFetcher()
    await expect(fetchOne('/api/thing', itemSchema)).rejects.toMatchObject({ status: 503 })
    const signals = (fetchMock.mock.calls as unknown as [string, RequestInit][]).map(([, init]) => init.signal)
    expect(new Set(signals).size).toBe(3)
  })

  it('throws ApiError with status after exhausting retries on 5xx', async () => {
    const fetchMock = stubFetch({ status: 500, statusText: 'Internal Server Error' })
    const { ApiError, fetchOne } = await importFetcher()

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

    const { fetchOne } = await importFetcher()
    expect(await fetchOne('/api/thing', itemSchema)).toEqual({ id: 4 })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(timeout).toHaveBeenCalledWith(10_000)
    timeout.mockRestore()
  })

  it('recovers from a transient 5xx (build-time flake protection)', async () => {
    const responses = [
      new Response('oops', { status: 503, statusText: 'Service Unavailable' }),
      new Response(JSON.stringify({
        status: 'success',
        data: { id: 9 },
      }), { status: 200 }),
    ]
    const fetchMock = vi.fn(async () => responses.shift()!)
    vi.stubGlobal('fetch', fetchMock)

    const { fetchOne } = await importFetcher()
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
      return new Response(JSON.stringify({
        status: 'success',
        data: { id: 3 },
      }), { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)

    const { fetchOne } = await importFetcher()
    expect(await fetchOne('/api/thing', itemSchema)).toEqual({ id: 3 })
  })

  it('retries a 2xx with a non-JSON body (CDN error page) and recovers', async () => {
    const responses = [
      new Response('<html>gateway error</html>', { status: 200 }),
      new Response(JSON.stringify({
        status: 'success',
        data: { id: 5 },
      }), { status: 200 }),
    ]
    const fetchMock = vi.fn(async () => responses.shift()!)
    vi.stubGlobal('fetch', fetchMock)

    const { fetchOne } = await importFetcher()
    expect(await fetchOne('/api/thing', itemSchema)).toEqual({ id: 5 })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('surfaces a descriptive error when every body is non-JSON', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<html>oops</html>', { status: 200 })))

    const { fetchOne } = await importFetcher()
    await expect(fetchOne('/api/thing', itemSchema)).rejects.toThrow(/Invalid JSON from/)
  })

  it('does NOT retry 4xx (a retried 404 would delay a legitimate notFound)', async () => {
    const fetchMock = stubFetch({ status: 404, statusText: 'Not Found' })
    const { fetchOne } = await importFetcher()

    await expect(fetchOne('/api/thing', itemSchema)).rejects.toMatchObject({ status: 404 })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('surfaces the API message and the real status from an error envelope', async () => {
    stubFetch({
      status: 404,
      statusText: 'Not Found',
      json: { status: 'error', message: 'Post not found.' },
    })
    const { fetchOne } = await importFetcher()
    await expect(fetchOne('/api/thing', itemSchema)).rejects.toMatchObject({
      status: 404,
      message: 'Post not found.',
    })
  })

  it('falls back to the status code when the body is not an error envelope', async () => {
    // an HTTP/2 response has an empty statusText, which must not leave the
    // message ending in a dangling colon
    stubFetch({
      status: 404,
      statusText: '',
      json: 'not an envelope',
    })
    const { fetchOne } = await importFetcher()
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
    const { fetchOne } = await importFetcher()
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
    const { fetchList } = await importFetcher()
    expect(await fetchList('/api/things', itemSchema)).toEqual([
      { id: 1 },
      { id: 2 },
    ])
  })

  it('rejects an envelope missing count', async () => {
    stubFetch({
      json: { status: 'success', data: [] },
    })
    const { fetchList } = await importFetcher()
    await expect(fetchList('/api/things', itemSchema)).rejects.toThrow(z.ZodError)
  })
})
