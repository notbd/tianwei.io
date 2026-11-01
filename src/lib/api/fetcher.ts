import type { z } from 'zod'
import { errorEnvelope, listEnvelope, successEnvelope } from './schemas'

/**
 * `path` on the content API. Fails fast and loud when CONTENT_API_URL is
 * unset: a relative fetch('/api/...') would otherwise HANG `next build` at
 * the page-data collection stage instead of erroring.
 */
export function apiUrl(path: string): string {
  const baseUrl = process.env.CONTENT_API_URL
  if (baseUrl === undefined || baseUrl === '') {
    throw new Error(
      'CONTENT_API_URL is not set: the frontend cannot reach the content API. '
      + 'Set it in .env.local (local dev) or the environment (CI workflow env / Vercel env).',
    )
  }
  return `${baseUrl}${path}`
}

/** A response the API answered with a non-2xx status (or an unusable body). */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// The API answers 404 for a slug it does not have and 400 for one that fails
// its slug validation (uppercase, consecutive hyphens, too long). Both mean
// the URL names no post, so pages render notFound() for both; the fetcher
// retries neither.
export function isNotFoundError(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 404 || error.status === 400)
}

export type FetchOptions = {
  next?: NextFetchRequestConfig
  cache?: RequestCache
  headers?: Record<string, string>
}

// Transient failures (network errors, timeouts, 5xx) are retried with
// exponential backoff; 4xx answers are final,
// since a retried 404 would only delay a legitimate notFound(). This mainly
// protects builds: one flaky request during static generation must not
// drop a page. Each attempt has its own deadline, so a hung API fails the
// build or the render in about half a minute instead of never.
//
// The per-attempt signal also makes the retries real during a render: Next
// memoizes identical GETs within one render pass, so without a signal a
// retry would get the first attempt's failure back without a request
// (https://nextjs.org/docs/app/api-reference/functions/fetch#memoization).
// The data cache key ignores the signal, so caching is unaffected.
const ATTEMPTS = 3
const BACKOFF_BASE_MS = 300
const ATTEMPT_TIMEOUT_MS = 10_000

async function requestJson(path: string, options: FetchOptions = {}): Promise<unknown> {
  const url = apiUrl(path)

  let lastError: unknown
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    if (attempt > 0)
      await new Promise(resolve => setTimeout(resolve, BACKOFF_BASE_MS * 2 ** (attempt - 1)))

    let response: Response
    let body: string
    try {
      // the deadline covers the body too: a stalled stream is a timeout
      response = await fetch(url, {
        ...options,
        headers: { Accept: 'application/json', ...options.headers },
        signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS),
      })
      body = await response.text()
    }
    catch (error) {
      lastError = error
      continue
    }

    if (!response.ok) {
      // the API's error envelope says why; fall back to the status code
      // when the body is not one (proxy page, empty body). Not statusText:
      // HTTP/2 responses carry none (Node 26's fetch negotiates it).
      const error = new ApiError(response.status, errorMessage(body) ?? `Request failed (${response.status})`)
      if (response.status < 500)
        throw error
      lastError = error
      continue
    }

    // A 2xx that is not JSON (a proxy's error page) is retried as well, but
    // for a cached fetch Next has already stored that body, so the retry
    // reads it back and the request fails loudly rather than recovering.
    try {
      return JSON.parse(body)
    }
    catch {
      lastError = new ApiError(response.status, `Invalid JSON from ${url} (${response.status}): ${body.slice(0, 120)}`)
    }
  }

  throw lastError
}

function errorMessage(body: string): string | undefined {
  try {
    const envelope = errorEnvelope.safeParse(JSON.parse(body))
    return envelope.success ? envelope.data.message : undefined
  }
  catch {
    return undefined
  }
}

/** GET a single resource: `{ status: 'success', data }`. */
export async function fetchOne<T>(
  path: string,
  schema: z.ZodType<T>,
  options?: FetchOptions,
): Promise<T> {
  return successEnvelope(schema).parse(await requestJson(path, options)).data
}

/** GET a list: `{ status: 'success', count, data: [] }`. */
export async function fetchList<T>(
  path: string,
  itemSchema: z.ZodType<T>,
  options?: FetchOptions,
): Promise<T[]> {
  return listEnvelope(itemSchema).parse(await requestJson(path, options)).data
}
