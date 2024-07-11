'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ThemeProviderProps } from 'next-themes/dist/types'
import { InitialThemeProvider } from '@/hooks/useInitialTheme'
import type { Theme } from '@/types/themeTypes'

type CustomThemeProviderProps = {
  initialTheme: Theme
} & ThemeProviderProps

export function ThemeProvider({
  initialTheme,
  children,
  ...props
}: CustomThemeProviderProps) {
  return (
    <InitialThemeProvider value={initialTheme}>
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        {...props}
      >
        {children}
      </NextThemesProvider>
    </InitialThemeProvider>
  )
}
