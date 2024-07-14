import type { DeploymentEnv } from '@/types/deploymentTypes'

export const BasePaths = {
  domain: process.env.VERCEL_URL || 'tianwei.io',
  url: `https://${process.env.VERCEL_URL || 'tianwei.io'}`,
}

export const AssetPaths = {
  // use different svg icons based on deployment environment
  iconSVG: (() => {
    const env = process.env.VERCEL_ENV as DeploymentEnv

    if (!env || !['development', 'preview', 'production'].includes(env)) {
      // no VERCEL_ENV: local development
      return '/assets/icon-squircle-local.svg'
    }

    switch (env as DeploymentEnv) {
      case 'development':
        return '/assets/icon-squircle-dev.svg'
      case 'preview':
        return '/assets/icon-squircle-preview.svg'
      case 'production':
        return '/assets/icon-squircle-variable.svg'
    }
  })(),

  // fallback icon for browsers (Safari) that do not support svg icon
  iconPNG: '/assets/icon-squircle-512.png',

  // favicon for legacy browsers
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
