import { Rubik } from 'next/font/google'
import localFont from 'next/font/local'

export const rubik = Rubik({
  subsets: ['latin'],
  variable: '--font-rubik',
})

export const berkeleyMono = localFont({
  src: './sources/BerkeleyMono-Regular.woff2',
  variable: '--font-berkeley-mono',
})
