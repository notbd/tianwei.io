import type { MetadataRoute } from 'next'
import { absoluteUrl } from '@/lib/paths'

export default function robots(): MetadataRoute.Robots {
  return {
    // one group for every crawler: a crawler-specific group would replace
    // this one for that crawler instead of adding to it
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/api/',
    },
    sitemap: absoluteUrl('/sitemap.xml'),
  }
}
