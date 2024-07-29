import { Rubik } from 'next/font/google'
import { cookies } from 'next/headers'
import '@/styles/globals.css'
import { metadata, viewport } from './metadata'
import { RootHeader } from '@/components/RootHeader'
import { RootFooter } from '@/components/RootFooter'
import { ConsistentThemeProvider } from '@/contexts/ConsistentThemeProvider'
import { cn } from '@/lib/utils'
import type { Theme } from '@/types/themeTypes'
import { DEFAULT_THEME, KEYS } from '@/constants/constants'

export { metadata, viewport } // declared in metadata.ts

const rubik = Rubik({ subsets: ['latin'] })

type RootLayoutProps = { children: React.ReactNode }

export default function RootLayout({
  children,
}: Readonly<RootLayoutProps>) {
  // read persistedTheme from cookies
  const themeCookie = cookies().get(KEYS.LAST_CHOSEN_THEME)
  const persistedTheme: Theme = themeCookie ? ((themeCookie.value as Theme) ?? DEFAULT_THEME) : DEFAULT_THEME // set default for `persistedTheme` when no last chosen theme cookie found

  return (
    <html lang="en" suppressHydrationWarning>

      {/* canvas */}
      <body
        className={cn(
          'min-h-screen w-full',
          'flex flex-col items-center',
          'bg-zinc-50 text-zinc-800 dark:bg-zinc-950 dark:text-zinc-50',
          // cannot add 'transition-colors' here, else it may cause a flash under dark mode,
          // since html always starts with light mode and 'dark' class is added later by code
          'antialiased',
          rubik.className,
        )}
      >

        {/* theme */}
        <ConsistentThemeProvider persistedTheme={persistedTheme}>

          {/* content */}
          <div
            className={cn(
              'w-full min-w-72 max-w-2xl grow',
              'flex flex-col justify-between px-4 py-8',
            )}
          >

            {/* top: header + main */}
            <div
              className="flex flex-col gap-y-12 transition-[row-gap] ease-out md:gap-y-14"
            >

              {/* header */}
              <RootHeader />

              {/* main */}
              <main>{children}</main>
            </div>

            {/* bottom: footer */}
            <RootFooter />

          </div>
        </ConsistentThemeProvider>
      </body>
    </html>
  )
}
