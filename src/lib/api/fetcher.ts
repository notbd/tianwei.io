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
}

async function baseFetch(endpoint: string, options?: FetchOptions): Promise<unknown> {
  const url = `${BASE_URL}${endpoint}`

  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (!response.ok) {
    throw new NetworkRequestError(
      response.status,
      `Request failed (${response.status}): ${response.statusText}`,
    )
  }

  return response.json()
}

function handleErrorResponse(json: unknown): void {
  const parseError = errorResponse.safeParse(json)
  if (parseError.success) {
    throw new NetworkRequestError(400, parseError.data.message)
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
  handleErrorResponse(json)

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
  handleErrorResponse(json)

  const responseSchema = successListResponse(itemSchema)
  const result = responseSchema.parse(json)

  return result.data
}
