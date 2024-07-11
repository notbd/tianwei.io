import type { Metadata } from 'next'
import { Rubik } from 'next/font/google'
import { cookies } from 'next/headers'
import './globals.css'
import { PageHeader } from '@/components/PageHeader'
import { PageFooter } from '@/components/PageFooter'
import { ThemeProvider } from '@/providers/ThemeProvider'
import { cn } from '@/lib/utils'
import type { Theme } from '@/types/themeTypes'
import { DEFAULT_THEME, KEYS } from '@/constants/constants'

export const metadata: Metadata = {
  title: {
    template: '%s · tianwei.io',
    default: 'Tianwei Zhang',
  },
  description: 'A software developer.',
  authors: {
    name: 'Tianwei Zhang',
    url: 'https://tianwei.io',
  },
  viewport: 'width=device-width, initial-scale=1',
  metadataBase: new URL('https://tianwei.io'),
  openGraph: {
    type: 'website',
    url: 'https://tianwei.io',
    title: 'Tianwei Zhang',
    description: 'A software developer.',
    siteName: 'Tianwei.io',
    images: [
      {
        url: 'https://tianwei.io/twitter.png',
        width: 2000,
        height: 1500,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tianwei Zhang • tianwei.io',
    description: 'A software developer.',
    creator: '@defnotbd',
    creatorId: '1110568647041400832',
    images: ['https://tianwei.io/twitter.png'],
  },
}

const rubik = Rubik({ subsets: ['latin'] })

type RootLayoutProps = { children: React.ReactNode }

export default function RootLayout({
  children,
}: Readonly<RootLayoutProps>) {
  // read initialTheme from cookies
  const themeCookie = cookies().get(KEYS.LAST_CHOSEN_THEME)
  const initialTheme: Theme = themeCookie ? ((themeCookie.value as Theme) ?? DEFAULT_THEME) : DEFAULT_THEME // set default when no last chosen theme cookie found

  return (
    <html lang="en" suppressHydrationWarning>

      <body className={rubik.className}>

        {/* theme */}
        <ThemeProvider initialTheme={initialTheme}>

          {/* canvas */}
          <div
            className={cn(
              'min-h-screen w-full bg-zinc-50 text-zinc-900 antialiased transition-colors duration-300 dark:bg-zinc-950 dark:text-zinc-50',
              'flex flex-col items-center',
            )}
          >

            {/* content */}
            <div
              className={cn(
                'w-full min-w-72 max-w-2xl grow',
                'flex flex-col justify-between px-4 py-8',
              )}
            >

              {/* top: header + main */}
              <div
                className="flex flex-col gap-y-10 transition-[row-gap] ease-out md:gap-y-12"
              >

                {/* header */}
                <PageHeader />

                {/* main */}
                <main>
                  {children}
                </main>
              </div>

              {/* bottom: footer */}
              <PageFooter />

            </div>
          </div>

        </ThemeProvider>
      </body>

    </html>
  )
}
