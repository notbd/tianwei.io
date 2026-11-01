import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { formatPostDate } from './dates'

// The content engine anchors authored calendar dates to America/New_York
// midnight; these instants are what actually lands in the database.

// Run WEST of ET. On a UTC (CI) or ET (dev) machine a formatter that lost
// the explicit timeZone would still pass every case below; in Los Angeles
// each ET midnight is still the previous evening, so the day flips.
beforeAll(() => {
  vi.stubEnv('TZ', 'America/Los_Angeles')
})

afterAll(() => {
  vi.unstubAllEnvs()
})

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

  it('renders the ET date on a machine west of ET', () => {
    // 2024-06-15 00:00 ET is 2024-06-14 21:00 in Los Angeles
    const stored = new Date(Date.UTC(2024, 5, 15, 4))
    expect(formatPostDate(stored)).toBe('June 15, 2024')
  })
})
