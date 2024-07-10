'use client'

import type { ComponentProps } from 'react'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { LaptopMinimal, Moon, Sun } from 'lucide-react'
import { setCookie } from 'cookies-next'
import { cn } from '@/lib/utils'
import { useInitialTheme } from '@/hooks/useInitialTheme'
import { DEFAULT_THEME, KEYS } from '@/constants/constants'

type ColorModeToggleProps = ComponentProps<'button'>

export function ColorModeToggle({
  className,
  ...props
}: ColorModeToggleProps) {
  const { theme, setTheme } = useTheme()
  const initialTheme = useInitialTheme()
  const [isMounted, setIsMounted] = useState(false)

  const toggleTheme = () => {
    let newChosenTheme = DEFAULT_THEME // set default theme when value returned by 'useTheme' hook is invalid
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
    setIsMounted(true)
  }, [])

  return (
    <button
      {...props}
      onClick={isMounted ? toggleTheme : () => {}}
      disabled={!isMounted}
      aria-label="Color Mode Toggle"
      title={theme}
      className={cn(
        'border-zinc-200 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400',
        'size-7 rounded-md border text-center transition-[border] duration-300',
        { 'cursor-default': !isMounted },
        className,
      )}
    >
      {isMounted ? (
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
      ) : (
        // rendering on server:
        // -> use intialTheme to match last used value and avoid FOUC
        (() => {
          // initialTheme value was already resolved and won't be empty
          switch (initialTheme) {
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
