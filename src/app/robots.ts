import type { MetadataRoute } from 'next'
import { SITE_BASE_URL } from '@/constants/constants'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: ('*'),
        allow: ['/'],
        disallow: [
          '/private/',
          '/no-crawl/',
          '/api/',
        ],
      },
      {
        userAgent: ('Googlebot'),
        disallow: ['/no-googlebot/'],
      },
    ],
    sitemap: `${SITE_BASE_URL}/sitemap.xml`,
  }
}
