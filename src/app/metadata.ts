import type { Metadata, Viewport } from 'next'
import { absoluteUrl, SITE_URL } from '@/lib/paths'
import { site } from '@/lib/site'

// The tab icon says which deployment you are looking at; no VERCEL_ENV
// means a local `next dev` / `next start`.
const ICON_VARIANT: Record<string, string> = {
  development: 'dev',
  preview: 'preview',
  production: 'variable',
}
const iconVariant = ICON_VARIANT[process.env.VERCEL_ENV ?? ''] ?? 'local'

// A page's own `openGraph` or `twitter` object replaces the root's whole
// object (Next merges metadata shallowly), so pages that set their own
// repeat these fields.
export const openGraphSiteName = 'Tianwei.io'
export const twitterAccounts = {
  siteId: site.twitter.id,
  creator: site.twitter.handle,
  creatorId: site.twitter.id,
}

export const metadata: Metadata = {
  title: {
    template: `%s · ${site.domain}`,
    default: site.name,
  },
  description: site.description,
  authors: {
    name: site.name,
    url: SITE_URL,
  },
  creator: site.name,
  generator: 'Next.js',
  keywords: [
    site.name,
    'notbd',
    site.domain,
    'Personal Website',
  ],
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: [
      {
        url: `/assets/icon-squircle-${iconVariant}.svg`,
        type: 'image/svg+xml',
        sizes: 'any',
      },
      {
        // for browsers without SVG icon support (Safari)
        url: '/favicon.ico',
        type: 'image/png', // a PNG despite the .ico name
        sizes: '192x192',
      },
    ],
    apple: {
      url: '/apple-touch-icon.png',
      type: 'image/png',
      sizes: '180x180',
    },
  },
  openGraph: {
    type: 'website',
    url: './', // resolved against each page's own path (and metadataBase)
    title: site.name,
    description: site.description,
    siteName: openGraphSiteName,
    images: [
      {
        url: absoluteUrl('/assets/icon-square-1024.png'),
        width: 1024,
        height: 1024,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${site.name} • ${site.domain}`,
    description: site.description,
    ...twitterAccounts,
    images: [
      absoluteUrl('/assets/banner-2_1-2048.png'),
    ],
  },
  alternates: {
    canonical: './', // same per-page resolution as og:url above
    types: {
      'application/rss+xml': absoluteUrl('/feed.xml'),
    },
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark light',
  width: 'device-width',
  initialScale: 1,
}
