import { createContext, useContext } from 'react'
import type { Theme } from '@/types/themeTypes'

const InitialThemeContext = createContext<Theme>('system')

export const InitialThemeProvider = InitialThemeContext.Provider

export function useInitialTheme() {
  return useContext(InitialThemeContext)
}
