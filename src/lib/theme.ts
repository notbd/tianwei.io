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
