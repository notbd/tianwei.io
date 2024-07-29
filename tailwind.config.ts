import type { Config } from 'tailwindcss'

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
  },

  plugins: [],
}
export default config
