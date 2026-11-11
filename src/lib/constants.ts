// ---- CONFIGURATION CONSTANTS ----

// The color theme choices; the toggle icons' CSS (globals.tailwind.css)
// selects on the same values
export const THEMES = ['system', 'dark', 'light'] as const
export type Theme = typeof THEMES[number]

// default color theme
export const DEFAULT_THEME: Theme = 'system'

const THEME_VALUES: ReadonlySet<unknown> = new Set(THEMES)

export function isTheme(value: unknown): value is Theme {
  return THEME_VALUES.has(value)
}

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
