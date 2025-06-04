'use client'

import type { ComponentProps } from 'react'
import { setCookie } from 'cookies-next'
import { LaptopMinimal, Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { DEFAULT_THEME, KEYS } from '@/lib/constants/constants'
import { useConsistentTheme } from '@/lib/hooks/useConsistentTheme'
import { cn } from '@/lib/utils'

type ColorModeToggleProps = ComponentProps<'button'>

export function ColorModeToggle({
  className,
  ...props
}: ColorModeToggleProps) {
  const { persistedTheme, theme, setTheme } = useConsistentTheme()
  const [isMounted, setIsMounted] = useState(false)

  const toggleTheme = () => {
    let newChosenTheme = DEFAULT_THEME // set default theme when `theme` value returned by hook is invalid (unlikely)
    switch (theme) {
      case 'system':
        newChosenTheme = 'dark'
        break
      case 'dark':
        newChosenTheme = 'light'
        break
      case 'light':
        newChosenTheme = 'system'
        break
    }
    setTheme(newChosenTheme)
    setCookie(KEYS.LAST_CHOSEN_THEME, newChosenTheme)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
    setIsMounted(true)
  }, [])

  return (
    <button
      {...props}
      type="button"
      onClick={isMounted ? toggleTheme : () => {}}
      disabled={!isMounted}
      aria-label="Color Mode Toggle"
      className={cn(
        'border-zinc-200 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400',
        'size-7 rounded-md border-[0.0625rem] text-center',
        { 'cursor-default': !isMounted },
        className,
      )}
    >
      {isMounted
        ? (
            // rendering on client
            (() => {
              switch (theme) {
                case 'system':
                  return <LaptopMinimal className="m-auto size-4" />
                case 'dark':
                  return <Moon className="m-auto size-4" />
                default: // 'light'
                  return <Sun className="m-auto size-4" />
              }
            })()
          )
        : (
            // rendering on server:
            // -> use persistedTheme to match last used value and avoid FOUC
            (() => {
              // persistedTheme value was already resolved and won't be empty
              switch (persistedTheme) {
                case 'system':
                  return <LaptopMinimal className="m-auto size-4" />
                case 'dark':
                  return <Moon className="m-auto size-4" />
                default: // 'light'
                  return <Sun className="m-auto size-4" />
              }
            })()
          )}
    </button>
  )
}
