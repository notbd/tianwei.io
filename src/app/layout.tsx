import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Tianwei Zhang',
  description: 'A software developer.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={inter.className}
      >
        {/* canvas */}
        <div
          className="flex min-h-screen flex-col items-center justify-between antialiased"
        >

          {/* top */}
          <div>

            {/* nav */}
            <nav />

            {/* main */}
            <main>
              {children}
            </main>
          </div>

          {/* footer */}
          <footer />
        </div>
      </body>
    </html>
  )
}
