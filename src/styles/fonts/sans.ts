import { Rubik } from 'next/font/google'

// font-sans, on every page (layout.tsx); font-mono is in mono.ts
export const rubik = Rubik({
  subsets: ['latin'],
  variable: '--font-rubik',
})
