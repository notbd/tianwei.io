'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ThemeProviderProps as NextThemeProviderProps } from 'next-themes/dist/types'
import { DEFAULT_THEME } from '@/constants/constants'
import type { PersistedThemeProviderProps } from '@/contexts/PersistedThemeProvider'
import { PersistedThemeProvider } from '@/contexts/PersistedThemeProvider'

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
