import type { Metadata } from 'next'
import { Rubik } from 'next/font/google'
import './globals.css'
import { PageHeader } from '@/components/PageHeader'
import { PageFooter } from '@/components/PageFooter'
import { ThemeProvider } from '@/components/ThemeProvider'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Tianwei Zhang',
  description: 'A software developer.',
}

const rubik = Rubik({ subsets: ['latin'] })

type RootLayoutProps = { children: React.ReactNode }

export default function RootLayout({
  children,
}: Readonly<RootLayoutProps>) {
  return (
    <html lang="en" suppressHydrationWarning>

      <body className={rubik.className}>

        {/* theme */}
        <ThemeProvider>

          {/* canvas */}
          <div
            className={cn(
              'min-h-screen bg-white text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-50',
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
                className="flex flex-col gap-y-10 transition-all duration-300 md:gap-y-12"
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
