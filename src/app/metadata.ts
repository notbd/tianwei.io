import type { Metadata, Viewport } from 'next'
import { AssetPaths, BasePaths } from '@/lib/paths'

export const metadata: Metadata = {
  title: {
    template: '%s · tianwei.io',
    default: 'Tianwei Zhang',
  },
  description: 'A software developer.',
  authors: {
    name: 'Tianwei Zhang',
    url: BasePaths.url,
  },
  creator: 'Tianwei Zhang',
  generator: 'Next.js',
  keywords: ['Tianwei Zhang', 'notbd', 'tianwei.io', 'Personal Website'],
  metadataBase: new URL(BasePaths.url),
  icons: {
    icon: [
      {
        url: AssetPaths.iconSVG,
        type: 'image/svg+xml',
        sizes: 'any',
      },
      {
        url: AssetPaths.favicon,
        type: 'image/png', // a PNG despite the .ico name
        sizes: '192x192',
      },
    ],
    apple: {
      url: AssetPaths.appleTouchIcon,
      type: 'image/png',
      sizes: '180x180',
    },
  },
  openGraph: {
    type: 'website',
    url: './', // resolved against each page's own path (and metadataBase)
    title: 'Tianwei Zhang',
    description: 'A software developer.',
    siteName: 'Tianwei.io',
    images: [
      {
        url: BasePaths.url + AssetPaths.openGraphImage,
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
    images: [BasePaths.url + AssetPaths.twitterImage],
  },
  alternates: {
    canonical: './', // same per-page resolution as og:url above
    types: {
      'application/rss+xml': `${BasePaths.url}/feed.xml`,
    },
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark light',
  width: 'device-width',
  initialScale: 1,
}
