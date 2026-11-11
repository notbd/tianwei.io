'use client'

import type { ComponentProps } from 'react'
import type { Theme } from '@/lib/constants'
import { LaptopMinimal, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect } from 'react'
import { flushSync } from 'react-dom'
import { DEFAULT_THEME, isTheme } from '@/lib/constants'
import { cn } from '@/lib/utils'

const NEXT_THEME = {
  system: 'dark',
  dark: 'light',
  light: 'system',
} satisfies Record<Theme, Theme>

type ColorModeToggleProps = ComponentProps<'button'>

/**
 * Cycles system -> dark -> light, cross-fading the whole page where the
 * View Transitions API exists and the reader has not asked for reduced
 * motion. (A colour transition on <body> is not an option: it would also
 * run on first paint, see the comment in layout.tsx.)
 *
 * All three icons are always in the DOM; CSS shows exactly one based on
 * the `data-theme-choice` attribute on <html>, which an inline script sets
 * before first paint and the effect below keeps in sync afterwards. That makes
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
    if (isTheme(theme))
      document.documentElement.setAttribute('data-theme-choice', theme)
  }, [theme])

  const toggleTheme = () => {
    const next = NEXT_THEME[isTheme(theme)
      ? theme
      : DEFAULT_THEME]

    if (!('startViewTransition' in document) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTheme(next)
      return
    }
    // The transition snapshots the page when the callback returns, so the
    // new theme must be in the DOM by then: flushSync renders synchronously,
    // and React runs the effects of a synchronous render (next-themes'
    // class switch, the icon attribute above) before returning. Measuring
    // the body then computes the new styles while next-themes' "no
    // transitions" rule is still in place (it lifts it a millisecond later),
    // so no link is caught mid-fade in the snapshot. (A call, because a bare
    // property read is dropped by the minifier.)
    document.startViewTransition(() => {
      // eslint-disable-next-line react/dom-no-flush-sync -- the snapshot needs the DOM updated synchronously
      flushSync(() => setTheme(next))
      document.body.getBoundingClientRect()
    })
  }

  return (
    <button
      {...props}
      type="button"
      onClick={toggleTheme}
      className={cn(
        'border-zinc-200 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400',
        'transition-[color] duration-200 hover:text-zinc-400 dark:hover:text-zinc-100',
        'size-7 rounded-md border text-center',
        'cursor-pointer',
        className,
      )}
    >
      <LaptopMinimal className="theme-icon theme-icon-system m-auto size-4" />
      <Moon className="theme-icon theme-icon-dark m-auto size-4" />
      <Sun className="theme-icon theme-icon-light m-auto size-4" />
      {/* accessible name follows the same CSS switch as the icons */}
      <span className="theme-icon theme-icon-system sr-only">Color theme: system</span>
      <span className="theme-icon theme-icon-dark sr-only">Color theme: dark</span>
      <span className="theme-icon theme-icon-light sr-only">Color theme: light</span>
    </button>
  )
}
