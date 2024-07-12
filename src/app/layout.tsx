import type { Metadata, Viewport } from 'next'
import { Rubik } from 'next/font/google'
import { cookies } from 'next/headers'
import './globals.css'
import { PageHeader } from '@/components/PageHeader'
import { PageFooter } from '@/components/PageFooter'
import { ConsistentThemeProvider } from '@/contexts/ConsistentThemeProvider'
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
  creator: 'Tianwei Zhang',
  generator: 'Next.js',
  keywords: ['Tianwei Zhang', 'notbd', 'tianwei.io', 'Personal Website', 'Next.js'],
  referrer: 'origin-when-cross-origin',
  metadataBase: new URL('https://tianwei.io'),
  openGraph: {
    type: 'website',
    url: 'https://tianwei.io',
    title: 'Tianwei Zhang',
    description: 'A software developer.',
    siteName: 'Tianwei.io',
    images: [
      {
        url: 'https://tianwei.io/logo/icon-square-1024.png',
        width: 1024,
        height: 1024,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tianwei Zhang • tianwei.io',
    description: 'A software developer.',
    siteId: '1110568647041400832',
    creator: '@defnotbd',
    creatorId: '1110568647041400832',
    images: ['https://tianwei.io/logo/banner-2_1-2048.png'],
  },
  manifest: 'https://tianwei.io/manifest.json',
}

export const viewport: Viewport = {
  colorScheme: 'dark light',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAFAFA' },
    { media: '(prefers-color-scheme: dark)', color: '#09090B' },
  ],
  width: 'device-width',
  initialScale: 1,
}

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

      <body className={rubik.className}>

        {/* theme */}
        <ConsistentThemeProvider persistedTheme={persistedTheme}>

          {/* canvas */}
          <div
            className={cn(
              'min-h-screen w-full bg-zinc-50 text-zinc-800 antialiased transition-colors duration-300 dark:bg-zinc-950 dark:text-zinc-50',
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
                className="flex flex-col gap-y-12 transition-[row-gap] ease-out md:gap-y-14"
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
        </ConsistentThemeProvider>
      </body>
    </html>
  )
}
