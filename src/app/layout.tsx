import { ThemeProvider } from 'next-themes'
import { RootFooter } from '@/components/RootFooter'
import { RootHeader } from '@/components/RootHeader'
import { DEFAULT_THEME, THEMES } from '@/lib/theme'
import { cn } from '@/lib/utils'
import { rubik } from '@/styles/fonts/sans'
import { metadata, viewport } from './metadata'
import '@/styles/globals.tailwind.css'

export { metadata, viewport } // declared in metadata.ts

// The theme choice lives entirely on the client (localStorage). No cookies:
// the server renders theme-agnostic markup, which keeps every route
// statically renderable. next-themes' own inline script applies the `dark`
// class before paint. The script below, the first thing in <body>, mirrors
// the stored choice (next-themes' localStorage key) into `data-theme-choice`
// before that paint too, so CSS shows the right toggle icon.
const themeChoiceScript = `(function(){var c=${JSON.stringify(DEFAULT_THEME)};try{var t=localStorage.getItem('theme');if(${JSON.stringify(THEMES)}.indexOf(t)>=0)c=t}catch(e){}document.documentElement.setAttribute('data-theme-choice',c)})()`

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
          rubik.variable,
        )}
      >
        {/* only constants are interpolated, as JSON, so safe by construction */}
        {/* eslint-disable-next-line react/dom-no-dangerously-set-innerhtml */}
        <script dangerouslySetInnerHTML={{ __html: themeChoiceScript }} />

        {/* theme */}
        <ThemeProvider
          attribute="class"
          defaultTheme={DEFAULT_THEME} // used when the user has no localStorage preference
          enableSystem
          // colors switch at once, inside the toggle's cross-fade, instead of
          // each element running its own hover transition
          disableTransitionOnChange
        >

          {/* content */}
          <div
            className={cn(
              'w-full min-w-72 max-w-3xl grow',
              'flex flex-col justify-between px-6 py-8',
            )}
          >

            {/* top: header + main */}
            <div
              className="flex flex-col gap-y-12 transition-[row-gap] ease-out motion-reduce:transition-none md:gap-y-14"
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
