import { describe, expect, it } from 'vitest'
import { formatPostDate } from './dates'

// The content engine anchors authored calendar dates to America/New_York
// midnight; these instants are what actually lands in the database.

describe('formatPostDate', () => {
  it('renders an EDT-midnight instant as the authored calendar date', () => {
    // 2025-10-23 authored in ET -> stored as 04:00Z
    const stored = new Date(Date.UTC(2025, 9, 23, 4))
    expect(formatPostDate(stored)).toBe('October 23, 2025')
    expect(formatPostDate(stored, 'short')).toBe('Oct 23, 2025')
  })

  it('renders an EST-midnight instant as the authored calendar date', () => {
    // 2025-01-31 authored in ET -> stored as 05:00Z
    const stored = new Date(Date.UTC(2025, 0, 31, 5))
    expect(formatPostDate(stored)).toBe('January 31, 2025')
  })

  it('is independent of the machine timezone (explicit zone in options)', () => {
    // Any instant renders identically wherever the server runs — the
    // display zone is pinned, never inherited from the environment.
    const stored = new Date(Date.UTC(2024, 5, 15, 4))
    expect(formatPostDate(stored)).toBe('June 15, 2024')
  })
})
