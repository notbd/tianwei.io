import { describe, expect, it } from 'vitest'
import { isNotFoundError, NetworkRequestError } from './errors'

describe('isNotFoundError', () => {
  it('matches the API 404 and the 400 it sends for a malformed slug', () => {
    expect(isNotFoundError(new NetworkRequestError(404, 'Post not found.'))).toBe(true)
    expect(isNotFoundError(new NetworkRequestError(400, 'Validation failed: slug - ...'))).toBe(true)
  })

  it('leaves every other failure to propagate', () => {
    expect(isNotFoundError(new NetworkRequestError(500, 'Request failed (500)'))).toBe(false)
    expect(isNotFoundError(new NetworkRequestError(401, 'Unauthorized'))).toBe(false)
    expect(isNotFoundError(new TypeError('fetch failed'))).toBe(false)
  })
})
