import type { DeploymentEnv } from '@/lib/types/deploymentTypes'

const CANONICAL_DOMAIN = 'tianwei.io'

// VERCEL_URL is ALWAYS the generated <deployment>.vercel.app URL — even in
// production — so absolute URLs (sitemap, feed, og:url, RSS guids) must use
// the canonical domain there, and the deployment URL only on previews.
const vercelEnv = process.env.VERCEL_ENV
const vercelUrl = process.env.VERCEL_URL
const isPreview = vercelEnv !== 'production' && vercelUrl !== undefined && vercelUrl !== ''
const domain = isPreview ? vercelUrl : CANONICAL_DOMAIN

export const BasePaths = {
  domain,
  url: `https://${domain}`,
}

export const AssetPaths = {
  // use different svg icons based on deployment environment
  iconSVG: (() => {
    const env = process.env.VERCEL_ENV as DeploymentEnv | undefined

    if (env === undefined || !['development', 'preview', 'production'].includes(env)) {
      // no VERCEL_ENV: local development
      return '/assets/icon-squircle-local.svg'
    }

    switch (env) {
      case 'development':
        return '/assets/icon-squircle-dev.svg'
      case 'preview':
        return '/assets/icon-squircle-preview.svg'
      case 'production':
        return '/assets/icon-squircle-variable.svg'
    }
  })(),

  // fallback favicon for browsers (Safari) that do not support svg icon
  favicon: '/favicon.ico',

  // apple touch icon for Apple devices
  appleTouchIcon: '/apple-touch-icon.png',

  // open graph image
  openGraphImage: '/assets/icon-square-1024.png',

  // twitter card image
  twitterImage: '/assets/banner-2_1-2048.png',

  // manifest icons for PWA splash screen
  manifestIcon512: '/assets/icon-squircle-512.png',

  // manifest icons for PWA home screen
  manifestIcon192: '/assets/icon-squircle-192.png',
}
