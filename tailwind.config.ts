import type { Config } from 'tailwindcss'
import { nestedListPlugin } from './src/styles/tailwind-plugins/nestedList'

const config: Config = {
  darkMode: 'selector',

  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-rubik)'],
        mono: ['var(--font-geist-mono)'],
      },
    },

    screens: {
      // change from px to rem
      'sm': '40rem',
      'md': '48rem',
      'lg': '64rem',
      'xl': '80rem',
      '2xl': '96rem',
    },
  },

  plugins: [
    nestedListPlugin,
  ],
}
export default config
