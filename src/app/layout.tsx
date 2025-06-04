import type { Theme } from '@/types/themeTypes'
import { cookies } from 'next/headers'
import { RootFooter } from '@/components/RootFooter'
import { RootHeader } from '@/components/RootHeader'
import { DEFAULT_THEME, KEYS } from '@/lib/constants/constants'
import { ConsistentThemeProvider } from '@/lib/contexts/ConsistentThemeProvider'
import { cn } from '@/lib/utils'
import { geistMono, rubik } from '@/styles/fonts'
import { metadata, viewport } from './metadata'
import '@/styles/globals.css'

export { metadata, viewport } // declared in metadata.ts

type RootLayoutProps = { children: React.ReactNode }

export default async function RootLayout(
  {
    children,
  }: Readonly<RootLayoutProps>,
) {
  // read persistedTheme from cookies
  const themeCookie = (await cookies()).get(KEYS.LAST_CHOSEN_THEME)
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
          'font-sans antialiased',
          `${rubik.variable} ${geistMono.variable}`,
        )}
      >

        {/* theme */}
        <ConsistentThemeProvider persistedTheme={persistedTheme}>

          {/* content */}
          <div
            className={cn(
              'w-full min-w-72 max-w-3xl grow',
              'flex flex-col justify-between px-6 py-8',
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
