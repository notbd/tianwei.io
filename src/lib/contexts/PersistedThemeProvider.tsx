import type { PersistedThemeContextState } from '@/lib/contexts/persistedThemeContext'
import type { Theme } from '@/types/themeTypes'
import { useMemo } from 'react'
import { PersistedThemeContext } from '@/lib/contexts/persistedThemeContext'

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
    <PersistedThemeContext
      value={exposedPersistedThemeValue}
    >
      {children}
    </PersistedThemeContext>
  )
}
