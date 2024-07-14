import type { MetadataRoute } from 'next'
import { BasePaths } from '@/lib/paths'

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
    sitemap: `${BasePaths.url}/sitemap.xml`,
  }
}
