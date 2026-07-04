import { RootFooter } from '@/components/RootFooter'
import { RootHeader } from '@/components/RootHeader'
import { ThemeProvider } from '@/lib/contexts/ThemeProvider'
import { cn } from '@/lib/utils'
import { berkeleyMono, rubik } from '@/styles/fonts'
import { metadata, viewport } from './metadata'
import '@/styles/globals.tailwind.css'

export { metadata, viewport } // declared in metadata.ts

// Mirrors the stored theme choice (next-themes' localStorage key) into a
// data attribute BEFORE first paint, so the toggle icon is correct without
// any server-side state. Runs synchronously as the first thing in <body>.
const themeChoiceScript = `(function(){var c='system';try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light')c=t}catch(e){}document.documentElement.setAttribute('data-theme-choice',c)})()`

type RootLayoutProps = { children: React.ReactNode }

export default function RootLayout(
  {
    children,
  }: Readonly<RootLayoutProps>,
) {
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
          `${rubik.variable} ${berkeleyMono.variable}`,
        )}
      >
        {/* eslint-disable-next-line react-dom/no-dangerously-set-innerhtml */}
        <script dangerouslySetInnerHTML={{ __html: themeChoiceScript }} />

        {/* theme */}
        <ThemeProvider>

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
        </ThemeProvider>
      </body>
    </html>
  )
}
