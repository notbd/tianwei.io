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
  it.each([
    ['an EDT midnight', '2025-10-23T04:00:00.000Z', 'October 23, 2025'],
    ['an EST midnight', '2025-01-31T05:00:00.000Z', 'January 31, 2025'],
  ])('renders %s as the authored calendar date', (_name, stored, shown) => {
    expect(formatPostDate(new Date(stored))).toBe(shown)
  })
})
