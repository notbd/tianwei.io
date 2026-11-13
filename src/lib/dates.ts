/**
 * IANA time zone all dates on the site are DISPLAYED in: the single
 * source of truth for rendering. Storage stays UTC instants.
 *
 * MUST match CONTENT_TIME_ZONE in tianwei-io-content, which anchors
 * authored calendar dates to this zone's midnight; the pairing is what
 * makes a stored instant render back as the authored date.
 * See docs/adr/0004-display-time-zone.md.
 */
export const DISPLAY_TIME_ZONE = 'America/New_York'

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
