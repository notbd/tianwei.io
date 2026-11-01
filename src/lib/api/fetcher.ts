import type { z } from 'zod'
import {
  errorResponse,
  successListResponse,
  successResponse,
} from '@/lib/api/responses'
import { BASE_URL } from './config'
import { NetworkRequestError } from './errors'

// =============================================================================
// Core Fetch Logic
// =============================================================================

type FetchOptions = {
  next?: NextFetchRequestConfig
  cache?: RequestCache
  headers?: Record<string, string>
}

// Transient failures (network errors, 5xx) are retried with exponential
// backoff. 4xx responses are semantic — retrying them can't help, and a
// retried 404 would delay a legitimate notFound(). This mainly protects
// builds: a single flaky request during SSG must not drop a page.
const RETRY_ATTEMPTS = 3
const RETRY_BASE_DELAY_MS = 300

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function baseFetch(endpoint: string, options?: FetchOptions): Promise<unknown> {
  const url = `${BASE_URL}${endpoint}`

  let lastError: unknown
  for (let attempt = 0; attempt < RETRY_ATTEMPTS; attempt++) {
    if (attempt > 0)
      await delay(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1))

    let response: Response
    try {
      response = await fetch(url, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...options?.headers },
      })
    }
    catch (err) {
      lastError = err
      continue
    }

    if (!response.ok) {
      // the API's error envelope says why; fall back to the status code
      // when the body is not one (proxy page, empty body). Not statusText:
      // HTTP/2 responses carry none (Node 26's fetch negotiates it).
      const requestError = new NetworkRequestError(
        response.status,
        errorEnvelopeMessage(await response.text()) ?? `Request failed (${response.status})`,
      )
      if (response.status >= 500) {
        lastError = requestError
        continue
      }
      throw requestError
    }

    // Parse inside the loop: a 2xx with a non-JSON body (proxy/CDN error
    // page) is just as transient as a 5xx and must be retried, not
    // surfaced as a bare SyntaxError that bypasses the retry loop.
    const rawBody = await response.text()
    try {
      return JSON.parse(rawBody)
    }
    catch {
      lastError = new NetworkRequestError(
        response.status,
        `Invalid JSON from ${url} (${response.status}): ${rawBody.slice(0, 120)}`,
      )
      continue
    }
  }

  throw lastError
}

function errorEnvelopeMessage(rawBody: string): string | undefined {
  try {
    const envelope = errorResponse.safeParse(JSON.parse(rawBody))
    return envelope.success ? envelope.data.message : undefined
  }
  catch {
    return undefined
  }
}

// =============================================================================
// Public Fetch Functions
// =============================================================================

/**
 * Fetch a single resource.
 * Validates using backend's { status: 'success', data: schema } response.
 */
export async function fetchOne<T>(
  endpoint: string,
  schema: z.ZodType<T>,
  options?: FetchOptions,
): Promise<T> {
  const json = await baseFetch(endpoint, options)

  const responseSchema = successResponse(schema)
  const result = responseSchema.parse(json)

  return result.data
}

/**
 * Fetch a list of resources.
 * Validates using backend's { status: 'success', count, data: schema[] } response.
 */
export async function fetchList<T>(
  endpoint: string,
  itemSchema: z.ZodType<T>,
  options?: FetchOptions,
): Promise<T[]> {
  const json = await baseFetch(endpoint, options)

  const responseSchema = successListResponse(itemSchema)
  const result = responseSchema.parse(json)

  return result.data
}
