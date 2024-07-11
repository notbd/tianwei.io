import { createContext } from 'react'
import type { Theme } from '@/types/themeTypes'
import { DEFAULT_THEME } from '@/constants/constants'

export type PersistedThemeContextState = {
  persistedTheme: Theme
}

const defaultPersistedThemeState: PersistedThemeContextState = {
  persistedTheme: DEFAULT_THEME,
}

export const PersistedThemeContext = createContext<PersistedThemeContextState>(defaultPersistedThemeState)
