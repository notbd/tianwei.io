'use client'

import type { ThemeProviderProps as NextThemeProviderProps } from 'next-themes/dist/types'
import type { PersistedThemeProviderProps } from '@/lib/contexts/PersistedThemeProvider'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { DEFAULT_THEME } from '@/lib/constants/constants'
import { PersistedThemeProvider } from '@/lib/contexts/PersistedThemeProvider'

type ThemeProviderProps = PersistedThemeProviderProps & NextThemeProviderProps

export function ConsistentThemeProvider({
  persistedTheme,
  children,
  ...props
}: ThemeProviderProps) {
  return (
    <PersistedThemeProvider persistedTheme={persistedTheme}>
      <NextThemesProvider
        attribute="class"
        defaultTheme={DEFAULT_THEME} // set default theme for 'next-themes' hook for when user has no localStorage preference
        enableSystem
        {...props}
      >
        {children}
      </NextThemesProvider>
    </PersistedThemeProvider>
  )
}
