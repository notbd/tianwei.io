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
    url: BasePaths.domain,
  },
  creator: 'Tianwei Zhang',
  generator: 'Next.js',
  keywords: ['Tianwei Zhang', 'notbd', 'tianwei.io', 'Personal Website'],
  referrer: 'origin-when-cross-origin',
  metadataBase: new URL('https://tianwei.io'),
  icons: {
    icon: [
      {
        url: AssetPaths.iconSVG,
        type: 'image/svg+xml',
        sizes: 'any',
      },
      {
        url: AssetPaths.favicon,
        type: 'image/png',
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
    url: BasePaths.url,
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
  manifest: `${BasePaths.url}/manifest.json`,
}

export const viewport: Viewport = {
  colorScheme: 'dark light',
  width: 'device-width',
  initialScale: 1,
}
