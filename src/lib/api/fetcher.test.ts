import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

// config.ts reads CONTENT_API_URL at import time, so modules are reset and
// dynamically imported after the env stub is in place.

const itemSchema = z.object({ id: z.number() })

function stubFetch(response: { status?: number, statusText?: string, json?: unknown }) {
  const { status = 200, statusText = 'OK', json = {} } = response
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(json), { status, statusText }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

async function importFetcher() {
  return import('./fetcher')
}

beforeEach(() => {
  vi.resetModules()
  vi.stubEnv('CONTENT_API_URL', 'https://api.example.test')
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('fetchOne', () => {
  it('returns data from a success envelope', async () => {
    stubFetch({ json: { status: 'success', data: { id: 7 } } })
    const { fetchOne } = await importFetcher()
    expect(await fetchOne('/api/thing', itemSchema)).toEqual({ id: 7 })
  })

  it('requests BASE_URL + endpoint', async () => {
    const fetchMock = stubFetch({ json: { status: 'success', data: { id: 1 } } })
    const { fetchOne } = await importFetcher()
    await fetchOne('/api/thing', itemSchema)
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/thing',
      expect.objectContaining({ headers: { 'Content-Type': 'application/json' } }),
    )
  })

  it('throws NetworkRequestError with status after exhausting retries on 5xx', async () => {
    const fetchMock = stubFetch({ status: 500, statusText: 'Internal Server Error' })
    const { fetchOne } = await importFetcher()
    const { NetworkRequestError } = await import('./errors')

    const failure = fetchOne('/api/thing', itemSchema)
    await expect(failure).rejects.toBeInstanceOf(NetworkRequestError)
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('recovers from a transient 5xx (build-time flake protection)', async () => {
    const responses = [
      new Response('oops', { status: 503, statusText: 'Service Unavailable' }),
      new Response(JSON.stringify({ status: 'success', data: { id: 9 } }), { status: 200 }),
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
      return new Response(JSON.stringify({ status: 'success', data: { id: 3 } }), { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)

    const { fetchOne } = await importFetcher()
    expect(await fetchOne('/api/thing', itemSchema)).toEqual({ id: 3 })
  })

  it('retries a 2xx with a non-JSON body (CDN error page) and recovers', async () => {
    const responses = [
      new Response('<html>gateway error</html>', { status: 200 }),
      new Response(JSON.stringify({ status: 'success', data: { id: 5 } }), { status: 200 }),
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

  it('throws with the message from a 2xx error envelope', async () => {
    stubFetch({ json: { status: 'error', message: 'Post not found.' } })
    const { fetchOne } = await importFetcher()
    await expect(fetchOne('/api/thing', itemSchema)).rejects.toMatchObject({
      status: 400,
      message: 'Post not found.',
    })
  })

  it('throws a ZodError on a malformed envelope', async () => {
    stubFetch({ json: { status: 'success', data: { id: 'not-a-number' } } })
    const { fetchOne } = await importFetcher()
    await expect(fetchOne('/api/thing', itemSchema)).rejects.toThrow(z.ZodError)
  })
})

describe('fetchList', () => {
  it('returns the data array from a success list envelope', async () => {
    stubFetch({ json: { status: 'success', count: 2, data: [{ id: 1 }, { id: 2 }] } })
    const { fetchList } = await importFetcher()
    expect(await fetchList('/api/things', itemSchema)).toEqual([{ id: 1 }, { id: 2 }])
  })

  it('rejects an envelope missing count', async () => {
    stubFetch({ json: { status: 'success', data: [] } })
    const { fetchList } = await importFetcher()
    await expect(fetchList('/api/things', itemSchema)).rejects.toThrow(z.ZodError)
  })
})
