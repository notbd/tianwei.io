'use client'

import type { ThemeProviderProps as NextThemeProviderProps } from 'next-themes'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { DEFAULT_THEME } from '@/lib/constants/constants'

/**
 * Thin wrapper around next-themes.
 *
 * The theme choice lives entirely on the client (localStorage): next-themes'
 * own inline script applies the `dark` class before paint, and a second
 * inline script in the root layout mirrors the stored choice into the
 * `data-theme-choice` attribute that drives the toggle icon via CSS.
 * No cookies — the server renders theme-agnostic markup, which keeps
 * every route statically renderable.
 */
export function ThemeProvider({ children, ...props }: NextThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={DEFAULT_THEME} // used when the user has no localStorage preference
      enableSystem
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}
