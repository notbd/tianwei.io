import { useMemo } from 'react'
import type { PersistedThemeContextState } from '@/lib/contexts/persistedThemeContext'
import { PersistedThemeContext } from '@/lib/contexts/persistedThemeContext'
import type { Theme } from '@/types/themeTypes'

export type PersistedThemeProviderProps = {
  persistedTheme: Theme
} & { children: React.ReactNode }

export function PersistedThemeProvider({
  persistedTheme,
  children,
}: PersistedThemeProviderProps) {
  const exposedPersistedThemeValue = useMemo<PersistedThemeContextState>(() => ({
    persistedTheme,
  }), [persistedTheme])

  return (
    <PersistedThemeContext.Provider
      value={exposedPersistedThemeValue}
    >
      {children}
    </PersistedThemeContext.Provider>
  )
}
