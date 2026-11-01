import { DISPLAY_TIME_ZONE } from '@/lib/constants'

/**
 * The one formatting path for post dates. Every visible date on the
 * site goes through here so the display time zone has a single owner.
 */
export function formatPostDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: DISPLAY_TIME_ZONE,
  })
}
