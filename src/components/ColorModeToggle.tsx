'use client'

import type { ComponentProps } from 'react'
import type { Theme } from '@/lib/types/themeTypes'
import { LaptopMinimal, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect } from 'react'
import { DEFAULT_THEME } from '@/lib/constants/constants'
import { cn } from '@/lib/utils'

const NEXT_THEME: Record<Theme, Theme> = {
  system: 'dark',
  dark: 'light',
  light: 'system',
}

type ColorModeToggleProps = ComponentProps<'button'>

/**
 * Cycles system -> dark -> light.
 *
 * All three icons are always in the DOM; CSS shows exactly one based on
 * the `data-theme-choice` attribute on <html>, which an inline script sets
 * before first paint and this handler keeps in sync afterwards. That makes
 * the server-rendered markup theme-agnostic (pages stay static) with no
 * icon flash on load.
 */
export function ColorModeToggle({
  className,
  ...props
}: ColorModeToggleProps) {
  const { theme, setTheme } = useTheme()

  // Derive the icon attribute from next-themes' state instead of setting
  // it in the click handler: theme can also change from OTHER sources
  // (cross-tab localStorage sync), and this keeps one source of truth.
  useEffect(() => {
    if (theme === 'system' || theme === 'dark' || theme === 'light')
      document.documentElement.setAttribute('data-theme-choice', theme)
  }, [theme])

  const toggleTheme = () => {
    const current: Theme = theme === 'dark' || theme === 'light' ? theme : DEFAULT_THEME
    setTheme(NEXT_THEME[current])
  }

  return (
    <button
      {...props}
      type="button"
      onClick={toggleTheme}
      aria-label="Color Mode Toggle"
      className={cn(
        'border-zinc-200 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400',
        'size-7 rounded-md border text-center',
        'cursor-pointer',
        className,
      )}
    >
      <LaptopMinimal className="theme-icon theme-icon-system m-auto size-4" />
      <Moon className="theme-icon theme-icon-dark m-auto size-4" />
      <Sun className="theme-icon theme-icon-light m-auto size-4" />
    </button>
  )
}
