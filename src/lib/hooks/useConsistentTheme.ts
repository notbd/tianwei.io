import { useTheme as useNextTheme } from 'next-themes'
import { useContext } from 'react'

import { PersistedThemeContext } from '@/lib/contexts/persistedThemeContext'

export function useConsistentTheme() {
  const persistedThemeContext = useContext(PersistedThemeContext)
  const nextThemeContext = useNextTheme()

  if (persistedThemeContext === undefined || nextThemeContext === undefined)
    throw new Error('useConsistentTheme() must be used within a ConsistentThemeProvider')

  return {
    ...persistedThemeContext,
    ...nextThemeContext,
  }
}
