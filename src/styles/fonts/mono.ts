import localFont from 'next/font/local'

// its own module: next/font preloads a font on the routes that import the
// module declaring it, and only post pages show code
export const berkeleyMono = localFont({
  src: './sources/BerkeleyMono-Regular.woff2',
  variable: '--font-berkeley-mono',
  // until the font loads, and if it never does, code stays monospaced: the
  // generated fallback would be a size-adjusted Arial
  fallback: [
    'ui-monospace',
    'SFMono-Regular',
    'Menlo',
    'Consolas',
    'monospace',
  ],
  adjustFontFallback: false,
})
